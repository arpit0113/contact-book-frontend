import { CountryCode, getCountries, getCountryCallingCode,
    getExampleNumber, isValidNumber, isValidPhoneNumber, parsePhoneNumberFromString,

 } from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";


export interface CountryOption {
    code: CountryCode;
    name: string;
    dial: string;

}

export const DEFAULT_COUNTRY : CountryCode = 'IN';
 
const regionNames = new Intl.DisplayNames(['en'], {type : 'region'});

export const COUNTRY_OPTIONS : CountryOption[] = getCountries().
    map((code) => ({
        code,
        name: regionNames.of(code) ?? code,
        dial : '+' + getCountryCallingCode(code),
    }))
    .sort((a,b) => a.name.localeCompare(b.name));

export function countryName(code: CountryCode): string {
    return COUNTRY_OPTIONS.find((c) => c.code === code)?.name ?? code;
}

export function exampleNumber(code : CountryCode): string {
    return getExampleNumber(code,examples)?.nationalNumber ?? '';
}

export function digitsOnly(value : string): string{
    return (value ?? '').replace(/\D/g,'');
}

export function isValidNational(country : CountryCode , national: string ) : boolean{
    return isValidPhoneNumber(national,country); 
}

export function toE164(country: CountryCode, national: string): string | null{
    return parsePhoneNumberFromString(national, country)?.number ?? null;
}

export function splitE164(e164: string):{country: CountryCode, national: string}{
     const parsed = parsePhoneNumberFromString(e164);
     if(parsed ?.country) return {country : parsed.country , national : parsed.nationalNumber};
     return {country : DEFAULT_COUNTRY , national : digitsOnly(e164)};
}