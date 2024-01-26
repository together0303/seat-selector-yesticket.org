import {Component, OnInit} from '@angular/core';
import { FormGroup, FormControl, FormArray } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AppService } from 'src/app/app.service';

const WIDTH = 500, Height = 400;

@Component({
    selector: 'custom-room-layout',
    templateUrl: './custom-room.component.html',
    styleUrls: ['./custom-room.component.scss']
})

export class CustomRoomComponent implements OnInit {
    size = {
        width: 10,
        height: 10
    }
    customBlock: FormGroup;
    constructor(private dialogRef: MatDialogRef<CustomRoomComponent>, public app:AppService) { }
    ngOnInit(): void {
        this.customBlock = new FormGroup({
            width: new FormControl(10),
            height: new FormControl(10)
        })
        this.customBlock.valueChanges.subscribe((values) => this.changeCustomSize(values));
    }
    changeCustomSize(values) {
        this.size = values;
    }
    create() {
        this.dialogRef.close(this.size);
    }
    cancel() {
        this.dialogRef.close();
    }    
}