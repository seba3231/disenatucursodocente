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

export class TwoWayMap<T, K> {
    map: Map<T, K>;
    reverseMap: Map<K, T>;
    constructor(map: Map<T, K>) {
        this.map = map;
        this.reverseMap = new Map<K, T>();
        map.forEach((value, key) => {
            this.reverseMap.set(value, key);
        });
    }
    get(key: T) {
        return this.map.get(key);
    }
    revGet(key: K) {
        return this.reverseMap.get(key);
    }
};

export const MapTipoInput = new TwoWayMap(new Map([
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
]));

export const MapTipoInputHTML = new Map([
    [TipoInput.porcentaje, 'number'],
]);