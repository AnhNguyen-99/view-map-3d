import { Injectable } from '@angular/core';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import * as THREE from 'three';

@Injectable({
  providedIn: 'root'
})
export class Obj2glbService {

  private objLoader = new OBJLoader();
  private gltfExporter = new GLTFExporter();

  async convert(objFile: File): Promise<Blob> {
    const objContent = await this.readFile(objFile);
    const scene = this.objLoader.parse(objContent);
    
    return new Promise((resolve, reject) => {
      this.gltfExporter.parse(
        scene,
        (gltf: ArrayBuffer | { [key: string]: unknown }) => {
          if (gltf instanceof ArrayBuffer) {
            resolve(new Blob([gltf], { type: 'model/gltf-binary' }));
          } else {
            reject(new Error('Unexpected GLTF format'));
          }
        },
        (error: any) => {
          reject(error);
        },
        { binary: true }
      );
    });
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
}
