import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';


const API_URL = `${environment.API}/api/crypto`;

export interface EncryptedPayload {
  keyId: string;
  encryptedKey: string;  iv: string;  cipherText: string;
}

@Injectable({providedIn: 'root',})
export class CryptoService { 

  constructor(private http: HttpClient) {}

  async encryptFileForUpload(file: File): Promise<EncryptedPayload> {  
 
    const { keyId, publicKey } = await firstValueFrom(
            this.http.get<{ keyId: string; publicKey: string }>(`${API_URL}/public-key`)  
    );

           
    const publicKeyBytes = base64ToArrayBuffer(publicKey);

    const rsaPublicKey = await crypto.subtle.importKey(
              'spki',
              publicKeyBytes,
              { name: 'RSA-OAEP', hash: 'SHA-256' },  
              false, 
              ['encrypt']   
    );

               
    const aesKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt',]
    );
 
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const fileBuffer = await file.arrayBuffer();  

    const cipherTextBuffer = await crypto.subtle.encrypt(  
        { name: 'AES-GCM', iv },
         aesKey,
         fileBuffer
    );

    
    const rawAesKey = await crypto.subtle.exportKey('raw', aesKey);   

    const encryptedKeyBuffer = await crypto.subtle.encrypt( 
        { name: 'RSA-OAEP' },
        rsaPublicKey,
        rawAesKey
    );

    return {  
      keyId, 
      encryptedKey: arrayBufferToBase64(encryptedKeyBuffer), 
      iv: arrayBufferToBase64(iv.buffer),    
      cipherText: arrayBufferToBase64(cipherTextBuffer),  
    }; 
 }
}


function arrayBufferToBase64(buffer: ArrayBuffer): string {  
  const bytes = new Uint8Array(buffer); 
   let binary = '';  
   for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]); 
    return btoa(binary);
  }
function base64ToArrayBuffer(base64: string): ArrayBuffer { 
   const binary = atob(base64);
     const bytes = new Uint8Array(binary.length);
       for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);  
       return bytes.buffer;
      }
