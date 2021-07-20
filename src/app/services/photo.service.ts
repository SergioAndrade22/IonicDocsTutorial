import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, CameraPhoto, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: PhotoI[] = [];
  private photoStorage = 'photos';
  private platform: Platform;

  constructor(platform: Platform) {
	this.platform = platform;
   }

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

	return this.platform.is('hybrid') ?
		{ filepath: savedPhoto.uri, webviewPath: Capacitor.convertFileSrc(savedPhoto.uri) } :
		{ filepath: fileName, webviewPath: cameraPhoto.webPath };
  }

  public async loadSaved() {
		const photoList = await Storage.get({key: this.photoStorage});
		this.photos = JSON.parse(photoList.value) || [];

		if (!this.platform.is('hybrid')) {
			for (const photo of this.photos) {
				const readFile = await Filesystem.readFile({
					path: photo.filepath,
					directory: Directory.Data
				});

				photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
			}
		}
	}

	public async deletePhoto(photo: PhotoI, position: number) {
		this.photos.splice(position, 1);

		Storage.set({
			key: this.photoStorage,
			value: JSON.stringify(this.photos)
		});

		const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);

		await Filesystem.deleteFile({
			path: filename,
			directory: Directory.Data
		});
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
		if (this.platform.is('hybrid')) {
			const file = await Filesystem.readFile({
				path: cameraPhoto.path
			});

			return file.data;
		} else {
			const response = await fetch(cameraPhoto.webPath);
			const blob = await response.blob();

			return await this.convertBlobToBase64(blob) as string;
		}
  }
}

export interface PhotoI {
	filepath: string;
	webviewPath: string;
}
