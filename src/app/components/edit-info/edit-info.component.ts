import { Component, OnInit, Inject } from "@angular/core";
import { FormGroup, FormControl, FormArray } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AppService } from "src/app/app.service";
import * as uuid from 'uuid';
@Component({
    selector: 'edit-info-component',
    templateUrl: './edit-info.component.html',
    styleUrls: ['./edit-info.component.scss']
})

export class EditInfoComponent implements OnInit {
    info = {
        seatId: null,
        name: '',
        description: '',
        category: null,
        available: false
    }
    error = '';
    existSeats = [];
    isEdit = 'connect';
    connected  = false;
    editBlock: FormGroup;
    connectBlock: FormGroup;

    constructor(@Inject(MAT_DIALOG_DATA) public data: any, private dialogRef: MatDialogRef<EditInfoComponent>, public app: AppService) {}
    ngOnInit(): void {
        this.existSeats = this.app.existSeats.filter((obj) => obj.connected === false);
        console.log(this.existSeats)
        if (this.data.seatId) {
            this.connected = true;
            const {seatId, rname, description, category, available} = this.data;
            this.info = {seatId, name: rname, description, category, available};
        }
        this.editBlock = new FormGroup({
            name: new FormControl(this.info.name),
            description: new FormControl(this.info.description),
            category: new FormControl(this.info.category?.id),
            available: new FormControl(this.info.available),
        })
        this.connectBlock = new FormGroup({
            seat: new FormControl(this.info)
        })
        this.editBlock.valueChanges.subscribe(() => this.changeInfo())
        this.connectBlock.valueChanges.subscribe(() => this.changeInfo())
        console.log(this.data)
    }
    categoryChanged(value) {
        const cate = this.app.chairCategories.find((obj) => obj.id === value);
        if (cate) {
            this.info.category = cate;
        }
    }
    changeEditOption(value) {
        this.isEdit = value;
    }
    changeInfo() {
        if (this.error) this.error = '';
        if (this.isEdit === 'edit') {
            const {name, description, available, category} = this.editBlock.value;
            const cate = this.app.chairCategories.find((obj) => obj.id === category);

            this.info = {
                seatId: null,
                name: name,
                description: description,
                category: cate, 
                available: available 
            }
        } else {
            const {seatId, name, description, category, available} = this.connectBlock.value.seat;
            this.info = {seatId, name, description, category, available};
        }
    }
    create() {
        const {seatId, name, description, category, available} = this.info;
        if (name && description && category) {
            const ind = this.app.existSeats.findIndex((obj) => obj.seatId === this.data.seatId);
            if (ind > -1) this.app.existSeats[ind]['connected'] = true;

            this.data.seatId = seatId;
            this.data.rname = name;
            this.data.description = description;
            this.data.category = category;
            this.data.available = available
            this.dialogRef.close(this.info);
        } else {
            this.error="please fill all required filed";
        }
    }
    disconnect() {
        const se = this.app.existSeats.find((obj) => obj.seatId === this.data.seatId);
        if (se) se.connected = false;
        this.existSeats = this.app.existSeats.filter((obj) => obj.connected === false);

        this.data.seatId = null;
        this.connected = false;
        this.info = {
            seatId: null,
            name: '',
            description: '',
            category: null,
            available: false
        }
        this.error = '';
        this.connectBlock = new FormGroup({
            seat: new FormControl(this.info)
        })
        this.connectBlock.valueChanges.subscribe(() => this.changeInfo())
    }
}