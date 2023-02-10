#https://stackoverflow.com/questions/19728555/node-js-require-doesnt-work-in-script
#https://stackoverflow.com/questions/35682131/electron-packager-cannot-find-module
$dirCompiladoAngular = "$PSScriptRoot\DisenaTuCursoDocente\out\disena-tu-curso-docente-win32-x64\resources\app\"
$imgOrigen="$PSScriptRoot\DisenaTuCursoDocente\out\disena-tu-curso-docente-win32-x64\resources\app\dist\disena-tu-curso-docente\assets\img"
$imgDestino="$PSScriptRoot\DisenaTuCursoDocente\out\disena-tu-curso-docente-win32-x64\resources\app\dist\assets"
$dirCompile="dist\"
$compiladoAngularOrigen="$PSScriptRoot\DisenaTuCursoDocente\dist"
$compiladoAngularDestino="$PSScriptRoot\DisenaTuCursoDocente\out\disena-tu-curso-docente-win32-x64\resources\app\"
$cursosDeDesarrollo="$PSScriptRoot\DisenaTuCursoDocente\out\disena-tu-curso-docente-win32-x64\resources\app\dist\disena-tu-curso-docente\assets\schemasData\"
#$filesDeDesarrollo="$PSScriptRoot\DisenaTuCursoDocente\out\disena-tu-curso-docente-win32-x64\resources\app\dist\disena-tu-curso-docente\assets\files\"

cd "$PSScriptRoot\DisenaTuCursoDocente"
write-host "COMPILANDO ANGULAR"
ng build --configuration production --base-href ./

rm -r -fo $("$compiladoAngularDestino"+"$dirCompile")
Copy-Item -Path "$compiladoAngularOrigen" -Destination "$compiladoAngularDestino" -recurse

#write-host "COMPILANDO ELECTRON"
#npm run make
#
#write-host "ELIMINANDO ARCHIVOS INNECESARIOS"
#Get-ChildItem "$dirCompiladoAngular" -Exclude dist,ElectronEntry.js,Backend.js,package.json,loading.html,node_modules | Remove-Item -Recurse -Force
#Get-ChildItem "$dirCompiladoAngular\node_modules" -Exclude accepts,body-parser,call-bind,content-disposition,content-type,cookie,cookie-signature,cors,depd,destroy,ee-first,encodeurl,escape-html,etag,express,finalhandler,forwarded,fresh,function-bind,get-intrinsic,has,has-symbols,http-errors,iconv-lite,inherits,media-typer,merge-descriptors,methods,mime,mime-db,mime-types,negotiator,object-assign,object-inspect,on-finished,parseurl,path-to-regexp,proxy-addr,qs,range-parser,raw-body,safer-buffer,send,serve-static,setprototypeof,side-channel,statuses,toidentifier,type-is,unpipe,utils-merge,vary | Remove-Item -Recurse -Force

write-host "ELIMINO CURSOS QUE HAYAN VENIDO DESDE DESARROLLO"
if(test-path -path "$cursosDeDesarrollo"){
    rm "$cursosDeDesarrollo\*"
}
else{
    mkdir "$cursosDeDesarrollo" | Out-Null
}




#write-host "ELIMINO FILES DE USUARIO QUE HAYAN VENIDO DESDE DESARROLLO"
#if(test-path -path "$filesDeDesarrollo"){
#    rm "$filesDeDesarrollo\*"
#}
#else{
#    mkdir "$filesDeDesarrollo" | Out-Null
#}
