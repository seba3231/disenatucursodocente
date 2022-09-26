
$dirCompiladoAngular = "$PSScriptRoot\DisenaTuCursoDocente\out\disena-tu-curso-docente-win32-x64\resources\app\"
$imgOrigen="$PSScriptRoot\DisenaTuCursoDocente\out\disena-tu-curso-docente-win32-x64\resources\app\dist\disena-tu-curso-docente\assets\img"
$imgDestino="$PSScriptRoot\DisenaTuCursoDocente\out\disena-tu-curso-docente-win32-x64\resources\app\dist\assets"
$cursosDeDesarrollo="$PSScriptRoot\DisenaTuCursoDocente\out\disena-tu-curso-docente-win32-x64\resources\app\dist\disena-tu-curso-docente\assets\schemasData\*"

cd "$PSScriptRoot\DisenaTuCursoDocente"
write-host "COMPILANDO ANGULAR"
ng build --configuration production --base-href ./

write-host "COMPILANDO ELECTRON"
npm run make

write-host "ELIMINANDO ARCHIVOS INNECESARIOS"
Get-ChildItem "$dirCompiladoAngular" -Exclude dist,ElectronEntry.js,Backend.js,package.json,loading.html | Remove-Item -Recurse -Force

write-host "MOVIENDO CARPETA IMG"
if(!(Test-Path -Path "$imgDestino")){
    mkdir "$imgDestino" > $null
}
if(Test-Path -Path "$imgOrigen"){
    mv "$imgOrigen" "$imgDestino"
}

write-host "ELIMINO CURSOS QUE HAYAN VENIDO DESDE DESARROLLO"
rm "$cursosDeDesarrollo"
