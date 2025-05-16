import { Component } from '@angular/core';
import { Obj2glbService } from '../obj2glb.service';

@Component({
  selector: 'app-obj-to-glb-converter',
  templateUrl: './obj-to-glb-converter.component.html',
  styleUrls: ['./obj-to-glb-converter.component.scss']
})
export class ObjToGlbConverterComponent {
  selectedFile: File | null = null;

  constructor(private converter: Obj2glbService) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  async convert() {
    console.log("ddđ");
    if (!this.selectedFile) return;

    try {
      const glbBlob = await this.converter.convert(this.selectedFile);
      this.downloadFile(glbBlob);
    } catch (error) {
      console.error('Conversion failed:', error);
    }
  }

  private downloadFile(blob: Blob) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.glb';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
