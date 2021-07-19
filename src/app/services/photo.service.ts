import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, CameraPhoto, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: PhotoI[] = [];
  private photoStorage = 'photos';

  constructor() { }

  public async addNewToGallery() {
	const capturedPhoto = await Camera.getPhoto({
		resultType: CameraResultType.Uri,
		source: CameraSource.Camera,
		quality: 100
	});

	const savedPhoto = await this.savePhoto(capturedPhoto);

	this.photos.unshift(savedPhoto);
	Storage.set({
		key: this.photoStorage,
		value: JSON.stringify(this.photos)
	});
  }

  public async savePhoto(cameraPhoto: CameraPhoto) {
	const base64Data = await this.readAsBase64(cameraPhoto);

	const fileName = new Date().getTime() + '.jpeg';
	const savedPhoto = await Filesystem.writeFile({
		path: fileName,
		data: base64Data,
		directory: Directory.Data
	});

	return { filepath: fileName, webviewPath: cameraPhoto.webPath };
  }

  public async loadSaved() {
	const photoList = await Storage.get({key: this.photoStorage});
	this.photos = JSON.parse(photoList.value) || [];

	for (const photo of this.photos) {
		const readFile = await Filesystem.readFile({
			path: photo.filepath,
			directory: Directory.Data
		});
		photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
	}
  }

  convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
	const reader = new FileReader();
	reader.onerror = reject;
	reader.onload = () => {
		resolve(reader.result);
	};
	reader.readAsDataURL(blob);
  });

  private async readAsBase64(cameraPhoto: CameraPhoto) {
	const response = await fetch(cameraPhoto.webPath);
	const blob = await response.blob();

	return await this.convertBlobToBase64(blob) as string;
  }
}

export interface PhotoI {
	filepath: string;
	webviewPath: string;
}
