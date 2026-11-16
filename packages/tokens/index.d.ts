export interface Token {type:'color'|'dimension'|'fontFamily'|'number'|'string';value:string|number}
export interface TokenDocument {schemaVersion:1;namespace:string;modes:Array<{id:string;selector:string;tokens:Record<string,Token>}>;aliases?:Record<string,string>}
export function validateTokens(input:unknown):string[];
export function validateCollection(input:unknown):string[];
/** Advice only; never part of validation. */
export function adviseTokens(input:unknown):string[];
export interface Direction {status?:'draft';product?:string;character?:string;world?:string;moments?:string[];signature?:string;voice?:string[]}
export function compileTokens(input:TokenDocument):string;
export function tokenVariable(path:string):string;

export function isLocalPath(value: unknown): boolean;
export function validateInventory(input: unknown, collection?: {id: string; fixtures: Array<{id: string}>}): string[];
