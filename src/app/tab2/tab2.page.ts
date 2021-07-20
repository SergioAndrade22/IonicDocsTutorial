import { Component, OnInit } from '@angular/core';
import { PhotoI, PhotoService } from '../services/photo.service';
import { ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit {

  constructor(public photoService: PhotoService, public actionSheetController: ActionSheetController) {}

  async ngOnInit() {
		await this.photoService.loadSaved();
  }

  addPhotoToGallery() {
		this.photoService.addNewToGallery();
	}

	public async showActionSheet(photo: PhotoI, position: number) {
		const actionSheet = await this.actionSheetController.create({
			header: 'Photos',
			buttons: [{
				text: 'Delete',
				role: 'destructive',
				icon: 'trash',
				handler: () => this.photoService.deletePhoto(photo, position)
			}, {
				text: 'Cancel',
				role: 'cancel',
				icon: 'close',
				handler: () => {}
			}]
		});

		await actionSheet.present();
	}
}
