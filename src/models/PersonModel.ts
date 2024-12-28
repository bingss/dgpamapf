
export interface PersonModel{
    name:string,
    age:number,
    address?:string,   //可有可無
}

export type PersonModelArray = PersonModel[];