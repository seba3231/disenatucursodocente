export enum TipoInput {
    number,
    selectFijoUnico,
    text,
    selectFijoMultiple,
    radio,
    porcentaje,
    archivo,
    selectUsuarioMultiple,
    date,
    dateLog
}

export const MapTipoInput = new Map([
    [TipoInput.number, 'number'],
    [TipoInput.selectFijoUnico, 'selectFijoUnico'],
    [TipoInput.text, 'text'],
    [TipoInput.selectFijoMultiple, 'selectFijoMultiple'],
    [TipoInput.radio, 'radio'],
    [TipoInput.porcentaje, 'porcentaje'],
    [TipoInput.archivo, 'archivo'],
    [TipoInput.selectUsuarioMultiple, 'selectUsuarioMultiple'],
    [TipoInput.date, 'date'],
    [TipoInput.dateLog, 'dateLog'],
]);
