import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, FormArray } from '@angular/forms';
import { fabric } from 'fabric';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { FURNISHINGS } from '../../models/furnishings';
import { createShape, RL_FILL, RL_STROKE } from '../../helpers';
import { AppService } from 'src/app/app.service';

const WIDTH = 800, HEIGHT = 400;
@Component({
  selector: 'app-chairs-layout',
  templateUrl: './chairs-layout.component.html',
  styleUrls: ['./chairs-layout.component.scss']
})
export class ChairsLayoutComponent implements OnInit {

  layout: fabric.Group;
  layoutOption = 'NORMAL';
  rectBlock: FormGroup;
  curvedBlock: FormGroup;
  view: fabric.Canvas;
  chairs = [];
  sps: FormArray; // Spacing between sections
  zoom = 100;
  rowMax = 0;
  chairsMax = 0;
  totalMax = 0;
  seats = [];
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private dialogRef: MatDialogRef<ChairsLayoutComponent>, public app: AppService) { }

  ngOnInit() {
    this.chairs = FURNISHINGS.chairs;
    
    this.rectBlock = new FormGroup({
      chair: new FormControl(0),
      rows: new FormControl(1),
      sections: new FormControl(1),
      chairs: new FormControl(12),
      spacing_chair: new FormControl(0),
      spacing_row: new FormControl(22),
      spacing_sections: new FormArray([1, 2, 3, 4].map(() => new FormControl(5)))
    });
    this.seats = this.data.filter(obj => !(obj.seat_canvas_x*1) && !(obj.seat_canvas_y*1))
    this.totalMax = this.seats.length;
    const array = [];
    for (let i = 0; i < 20; i++) {
      array.push(i);
    }

    this.curvedBlock = new FormGroup({
      chair: new FormControl(0),
      radius: new FormControl(200),
      angle: new FormControl(180),
      rows: new FormControl(1),
      spacing_row: new FormControl(40),
      chairs: new FormArray(new Array(10).fill(new FormControl(10))),
    });

    this.view = new fabric.Canvas('layout_chairs');
    this.view.setWidth(WIDTH);
    this.view.setHeight(HEIGHT);
    if (this.seats.length === 0) {
      const noText = new fabric.IText((this.app.lang?.all_seat_placed || 'All seat is placed.'), {
        fontSize: 12,
        lineHeight: 0.8,
        name: 'TEXT',
        fontFamily: 'Arial',
        hasControls: true
      });
      this.view.add(noText);
      noText.set({
        left:this.view.width/2 - noText.width/2,
        top:this.view.height/2 - noText.height/2
      })
      return;
    }

    let previousValues = {
      rows: this.rectBlock.controls['rows'].value,
      chairs: this.rectBlock.controls['chairs'].value
    }
    this.rectBlock.valueChanges.subscribe((newValues) => {
      if (newValues.rows !== previousValues.rows) {
        previousValues = {
          rows: this.rectBlock.controls['rows'].value,
          chairs: this.rectBlock.controls['chairs'].value
        }
        const c_chairs = Math.ceil(this.totalMax/newValues.rows);
        if (c_chairs >= newValues.chairs) {
          this.changeLayout();
        } else {
          this.rectBlock.controls['chairs'].setValue(c_chairs);
        }
      } else if (newValues.chairs !== previousValues.chairs) {
        previousValues = {
          rows: this.rectBlock.controls['rows'].value,
          chairs: this.rectBlock.controls['chairs'].value
        }
        const c_rows = Math.ceil(this.totalMax/newValues.chairs);
        if (c_rows >= newValues.rows) {
          this.changeLayout();          
        } else {
          this.rectBlock.controls['rows'].setValue(c_rows);
        }
      } else {
        console.log('changedLayout')
        this.changeLayout();
      }

    });
    this.curvedBlock.valueChanges.subscribe(() => this.changeLayout());
    this.changeLayout();
  }

  layoutOptionChanged(value: 'CURVED' | 'NORMAL') {
    this.layoutOption = value;
    this.changeLayout();
  }


  changeLayout() {
    const chrs = [];
    if (this.layoutOption === 'CURVED') {
      const { radius, angle, rows, chair, spacing_row, chairs } = this.curvedBlock.value;
      const start = -(angle / 2);
      for (let r = 0; r < rows; r++) {
        const N = chairs[r], A = angle / N;
        const rad = radius + r * spacing_row;
        for (let i = 0; i <= N; i += 1) {
          const ca = start + i * A;
          const chr = createShape(this.chairs[chair], RL_STROKE, RL_FILL);
          chr.angle = ca;
          const x = Math.sin(this.toRadians(ca)) * rad;
          const y = Math.cos(this.toRadians(ca)) * rad;
          chr.left = x;
          chr.top = -y;
          chr.angle += 180;
          chrs.push(chr);
        }
      }
    } else {
      const { rows, sections, chairs, spacing_chair, spacing_row, chair } = this.rectBlock.value;
      const total = rows * chairs;
      this.rowMax = Math.ceil(this.totalMax/chairs);
      const cps = Math.floor(chairs / sections); // Chairs per section
      let x = 0, y = 0;

      for (let i = 0; i < total; i++) {
        if (i > this.totalMax) continue;
        let stroke = RL_STROKE;
        let fill = RL_FILL;
        let newParts = [];
        if (this.seats[i]) {
          stroke = this.seats[i].pricecategory_color;
          if (this.seats[i].seat_status !== 'available') {
            newParts.push({ type: 'line', line: [0, 0, 18, 20], definition: { stroke: 'black', strokeWidth: 1 } })
            newParts.push({ type: 'line', line: [0, 20, 18, 0], definition: { stroke: 'black', strokeWidth: 1 } })
          }
          const chr:any = createShape({...this.chairs[chair], parts: [...this.chairs[chair].parts, ...newParts]}, stroke, fill, 'CHAIR') as fabric.Object;
          chr.seat = this.seats[i];
          chr.left = x, chr.top = y;

          if ((i + 1)% chairs === 0) {
            y += (spacing_row + chr.height);
            x = 0;
          } else {
            x += (chr.width + spacing_chair);
            const s = Math.floor((i + 1)% chairs / cps);
            if ((i + 1)% chairs % cps === 0 && s + 1 <= this.sections) {
              x += this.rectBlock.value.spacing_sections[s - 1];
            }
          }
          chrs.push(chr);
        }
      }
    }
    this.view.clear();
    this.layout = new fabric.Group(chrs, {
      originX: 'center',
      originY: 'center',
      left: WIDTH / 2,
      top: HEIGHT / 2,
      selectable: false,
      name: 'GROUP:layout',
      hasControls: false,
    });
    this.layout.scale(this.zoom / 100);
    this.view.add(this.layout);
    this.view.renderAll();
  }

  onZoom(value: number) {
    this.zoom = value;
    this.layout.scale(value / 100);
    this.view.renderAll();
  }

  get spacing_sections() {
    const c = this.rectBlock.get('spacing_sections') as FormArray;
    return c.controls;
  }

  get sections() {
    return this.rectBlock.value.sections;
  }

  get curved_chairs() {
    const c = this.curvedBlock.get('chairs') as FormArray;
    return c.controls;
  }

  get curved_rows() {
    return this.curvedBlock.value.rows;
  }

  create() {
    this.layout.selectable = true;
    this.layout.scale(1);
    this.dialogRef.close(this.layout);
  }

  cancel() {
    this.dialogRef.close();
  }

  toRadians(angle: number) {
    return angle * (Math.PI / 180);
  }

  toDegrees(radian: number) {
    return radian * (180 / Math.PI);
  }
}
