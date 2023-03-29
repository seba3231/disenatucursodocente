#https://stackoverflow.com/questions/19728555/node-js-require-doesnt-work-in-script
#https://stackoverflow.com/questions/35682131/electron-packager-cannot-find-module

$targets = @()
$targets += 'darwin-x64'
$targets += 'linux-x64'
$targets += 'win32-ia32'
#$targets += 'win32-x64'

cd "$PSScriptRoot\DisenaTuCursoDocente"
write-host "COMPILANDO ANGULAR"
ng build --configuration production --base-href ./

foreach ($target in $targets) {
    $dirCompiladoProyecto = "$PSScriptRoot\DisenaTuCursoDocente\out\disena-tu-curso-docente-$target\resources\app\"
    $cursosDeDesarrollo="$PSScriptRoot\DisenaTuCursoDocente\out\disena-tu-curso-docente-$target\resources\app\dist\disena-tu-curso-docente\assets\schemasData\"

    write-host "-----------------------------------"
    write-host "COMPILANDO ELECTRON para $target"
    #Si se está detrás de un firewall corporativo, el compilado puede fallar
    #Antes de correr el script ejecutar:
    #$env:NODE_TLS_REJECT_UNAUTHORIZED=0
    #Luego, volver a como estaba:
    #$env:NODE_TLS_REJECT_UNAUTHORIZED=1

    #arch=[ia32, x64, armv7l, arm64, mips64el, universal]
    #platform=[darwin, linux, mas, win32]

    #npm run package -- --platform=darwin --arch=ia32
    #WARNING: The platform/arch combination darwin/ia32 is not currently supported by Electron Packager

    #npm run package -- --platform=linux --arch=ia32
    #HTTP 404 https://github.com/electron/electron/releases/download/v20.0.1/electron-v20.0.1-linux-ia32.zip
    #Parece que no existe linux-ia32 para ninguna versión de Electron
    #https://www.electronjs.org/blog/linux-32bit-support

    $arrayTarget=$target -split '-'
    $platform=$arrayTarget[0]
    $arch=$arrayTarget[1]

    npm run package -- --platform=$platform --arch=$arch

    #El compilador empaqueta todas las dependencias del proyecto.
    #No todas las dependencias del proyecto son necesarias para ejecutar el binario compilado.
    write-host "ELIMINANDO ARCHIVOS INNECESARIOS"
    switch ($target) {
        "win32-x64"  {
            $dependencias="accepts,body-parser,call-bind,content-disposition,content-type,cookie,cookie-signature,cors,depd,destroy,ee-first,encodeurl,escape-html,etag,express,finalhandler,forwarded,fresh,function-bind,get-intrinsic,has,has-symbols,http-errors,iconv-lite,inherits,media-typer,merge-descriptors,methods,mime,mime-db,mime-types,negotiator,object-assign,object-inspect,on-finished,parseurl,path-to-regexp,proxy-addr,qs,range-parser,raw-body,safer-buffer,send,serve-static,setprototypeof,side-channel,statuses,toidentifier,type-is,unpipe,utils-merge,vary"
            break
        }
        "win32-ia32"   {
            $dependencias="accepts,body-parser,call-bind,content-disposition,content-type,cookie,cookie-signature,cors,depd,destroy,ee-first,encodeurl,escape-html,etag,express,finalhandler,forwarded,fresh,function-bind,get-intrinsic,has,has-symbols,http-errors,iconv-lite,inherits,media-typer,merge-descriptors,methods,mime,mime-db,mime-types,negotiator,object-assign,object-inspect,on-finished,parseurl,path-to-regexp,proxy-addr,qs,range-parser,raw-body,safer-buffer,send,serve-static,setprototypeof,side-channel,statuses,toidentifier,type-is,unpipe,utils-merge,vary"
            $dependencias+=",array-flatten,bytes,ipaddr.js,ms,safe-buffer"
            break
        }
        "linux-x64"  {
            $dependencias="accepts,body-parser,call-bind,content-disposition,content-type,cookie,cookie-signature,cors,depd,destroy,ee-first,encodeurl,escape-html,etag,express,finalhandler,forwarded,fresh,function-bind,get-intrinsic,has,has-symbols,http-errors,iconv-lite,inherits,media-typer,merge-descriptors,methods,mime,mime-db,mime-types,negotiator,object-assign,object-inspect,on-finished,parseurl,path-to-regexp,proxy-addr,qs,range-parser,raw-body,safer-buffer,send,serve-static,setprototypeof,side-channel,statuses,toidentifier,type-is,unpipe,utils-merge,vary"
            break
        }
        "darwin-x64"  {
            $cursosDeDesarrollo="$PSScriptRoot\DisenaTuCursoDocente\out\disena-tu-curso-docente-$target\disena-tu-curso-docente.app\Contents\Resources\app\dist\disena-tu-curso-docente\assets\schemasData\"
            $dirCompiladoProyecto = "$PSScriptRoot\DisenaTuCursoDocente\out\disena-tu-curso-docente-$target\disena-tu-curso-docente.app\Contents\Resources\app\"
            $dependencias="accepts,body-parser,call-bind,content-disposition,content-type,cookie,cookie-signature,cors,depd,destroy,ee-first,encodeurl,escape-html,etag,express,finalhandler,forwarded,fresh,function-bind,get-intrinsic,has,has-symbols,http-errors,iconv-lite,inherits,media-typer,merge-descriptors,methods,mime,mime-db,mime-types,negotiator,object-assign,object-inspect,on-finished,parseurl,path-to-regexp,proxy-addr,qs,range-parser,raw-body,safer-buffer,send,serve-static,setprototypeof,side-channel,statuses,toidentifier,type-is,unpipe,utils-merge,vary"
            break
        }
        default {
            write-host "Target $target desconocido"
            continue
        }
    }
    $arrayDep = $dependencias -split ','
    Get-ChildItem "$dirCompiladoProyecto" -Exclude dist,ElectronEntry.js,Backend.js,package.json,loading.html,node_modules | Remove-Item -Recurse -Force
    Get-ChildItem "$dirCompiladoProyecto\node_modules" -Exclude $arrayDep | Remove-Item -Recurse -Force

    write-host "ELIMINO CURSOS QUE HAYAN VENIDO DESDE DESARROLLO"
    if(test-path -path "$cursosDeDesarrollo"){
        rm "$cursosDeDesarrollo\*"
    }
    else{
        mkdir "$cursosDeDesarrollo" | Out-Null
    }
}

cd "$PSScriptRoot"
