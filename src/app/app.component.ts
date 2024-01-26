import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { FormGroup, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { NotifierService } from 'angular-notifier';
import { Location } from '@angular/common';
import { environment } from 'src/environments/environment';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faReply,
  faShare,
  faClone,
  faTrash,
  faUndo,
  faRedo,
  faObjectGroup,
  faObjectUngroup,
  faPlus,
  faMinus
} from '@fortawesome/free-solid-svg-icons';

import { FURNISHINGS } from './models/furnishings';
import { AppService } from './app.service';
import { ChairsLayoutComponent } from './components/chairs-layout/chairs-layout.component';
import { CustomRoomComponent } from './components/custom-room/custom-room.component';
import { EditInfoComponent } from './components/edit-info/edit-info.component';

library.add(faReply, faShare, faClone, faTrash, faUndo, faRedo, faObjectGroup, faObjectUngroup, faMinus, faPlus);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'room-layout';

  init = false;
  furnishings = FURNISHINGS;
  defaultChair = FURNISHINGS.chairs[0];
  defaultChairIndex = 0;

  textForm: FormGroup;

  previewItem = null;
  previewType = null;

  // icons
  faReply = faReply;
  faShare = faShare;
  faClone = faClone;
  faTrash = faTrash;
  faUndo = faUndo;
  faRedo = faRedo;
  faObjectGroup = faObjectGroup;
  faObjectUngroup = faObjectUngroup;
  faPlus = faPlus;
  faMinus = faMinus;
  seats:any[] = [];
  seatmap: any;
  lang = 'de';
  key = null;
  seatmap_id='';
  const_url='';
  private readonly notifier: NotifierService;

  constructor(private location: Location, public app: AppService, private dialog: MatDialog, private http: HttpClient, notifierService: NotifierService) { 
    this.notifier = notifierService;
    const win:any = window;
    this.lang = win.lang;
    this.key = win.key;
    this.seatmap_id = win.seatmap_id;
    this.const_url = win.const_url;
    this.app.rootEventEmitter.subscribe((obj) => {
      this.editObject(obj)
    })
    this.app.seatEventEmitter.subscribe((obj) => {
      this.installedSeat(obj)
    })
    this.app.saveEventEmitter.subscribe((obj) => {
      this.saveAll(obj)
    })
    this.app.seatStateEmitter.subscribe((chairs) => {
      const url = this.location.path();
      const params = new URLSearchParams(url.split('?')[1]);
      console.log(params);

      const existChairs = [];
      chairs.forEach(chair => {
        existChairs.push(chair.seat.seat_id);
        //sync seat with seat element on canvas
        const e_seat = this.seats.find(seat => seat.seat_id === chair.seat.seat_id);
        chair.seat = e_seat;
        chair.seat.seat_canvas_x = chair.left + chair.c_x;
        chair.seat.seat_canvas_y = chair.top + chair.c_y;
      })
      this.seats.forEach(seat => {
        if (!existChairs.includes(seat.seat_id)) {
          seat.seat_canvas_x = 0;
          seat.seat_canvas_y = 0; 
        }
      })
      setTimeout(() => {
        this.app.defaultChair.next(this.defaultChair);
      }, 100);
    })
  }

  ngOnInit() {
    const defaultChair = FURNISHINGS.chairs[0];
    this.getDataFromApi();

    setTimeout(() => {
      this.init = true;
    }, 100);
    this.initTextForm();
  }

  getDataFromApi(): void {
    this.http.get(this.const_url + 'api/internal/seatmap.php?key=' +this.key+ '&seatmap_id='+this.seatmap_id+'&lang=' + this.lang).subscribe((data: any) => {
      this.seats = data.seats.sort((a, b) => {
          const regex = /(\d+)-(\d+)/;
          const aMatch = a.seat_name.match(regex);
          const bMatch = b.seat_name.match(regex);
          
          if (aMatch && bMatch) {
            const aNumber1 = parseInt(aMatch[1]);
            const aNumber2 = parseInt(aMatch[2]);
            const bNumber1 = parseInt(bMatch[1]);
            const bNumber2 = parseInt(bMatch[2]);
        
            if (aNumber1 === bNumber1) {
              return aNumber2 - bNumber2;
            } else {
              return aNumber1 - bNumber1;
            }
          } else {
            return a.seat_name.localeCompare(b.seat_name);
          }
        })
        this.seatmap = data.seatmap;
        this.app.panelSet.next(data.seatmap.seatmap_canvas_json);
        setTimeout(() => {
          this.app.defaultChair.next(this.defaultChair);
          for (let i = 0; i < this.seats.length; i++) {
            if (this.seats[i]['seat_canvas_x']*1 && this.seats[i]['seat_canvas_y']*1) {
              this.insert(this.defaultChair, 'CHAIR', this.seats[i])
            }
          }
        }, 100);

    }, (error: any) => {
      this.app.panelSet.next(null);
      console.error(error);
    })

    this.http.get(this.const_url + 'seatmap/language.json.php?lang=' + this.lang, {responseType: 'text'}).subscribe((data: any) => {
      this.app.lang = JSON.parse(data);
    })

  }
  insert(object: any, type: string, seat?: any) {
    if (this.app.roomEdit) { return; }
    this.app.insertObject.next({ type, object, seat });
  }
  drag(object: any, type: string, seat?: any) {
    if (this.app.roomEdit) { return ;}
    this.app.draggingObject = {object, type, seat};
  }

  addCustomRoom() {
    if (this.app.roomEdit) { return ;}
    const ref = this.dialog.open(CustomRoomComponent);
    ref.afterClosed().subscribe(res => {
      if (!res) {
        return ;
      }
      const room = {
        type: 'ROOM',
        object: {
          title: res.width + '\'' + res.height + '\' Custom Room',
          width: res.width * 40,
          height: res.height * 40
        }
      }
      this.app.insertObject.next(room);
    })
    // this.app.addCustomRoom.next();
  }

  defaultChairChanged(index: number) {
    this.defaultChairIndex = index;
    this.app.defaultChair.next(FURNISHINGS.chairs[index]);
  }

  initTextForm() {
    this.textForm = new FormGroup({
      text: new FormControl('New Text'),
      font_size: new FormControl(16),
      direction: new FormControl('HORIZONTAL')
    });
  }

  insertNewText() {
    this.insert({ ...this.textForm.value, name: 'TEXT:Text' }, 'TEXT');
  }

  layoutChairs() {
    const ref = this.dialog.open(ChairsLayoutComponent, {
      data: this.seats
    });
    ref.afterClosed().subscribe(res => {
      if (!res) {
        return;
      }
      this.insert(res, 'LAYOUT');
    });
  }

  download(format: string) {
    this.app.performOperation.next(format);
  }

  onZoom(value) {
    this.app.zoom = value;
    this.app.performOperation.next('ZOOM');
  }
  editObject(obj: any) {
    if (obj && obj.name) {
      const ref = this.dialog.open(EditInfoComponent, {
        data: obj
      });
      ref.afterClosed().subscribe(res => {
        console.log(res);
        if (!res) {
          return ;
        }
      })
    }
  }
  installedSeat({seat, isDelete}) {
    if (isDelete) {
      seat.seat_canvas_x = 0;
      seat.seat_canvas_y = 0;
      setTimeout(() => {
        this.app.defaultChair.next(this.defaultChair);
      }, 100);
    } else {

    }
  }

  saveAll(obj) {
    // obj.seats = this.seats;
    // console.log(this.seats)
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    this.http.post(this.const_url + 'api/internal/seatmap.php?key='+this.key+'&seatmap_id='+this.seatmap_id+'&lang='+this.lang+'&action=savecanvas', {
      'seatmap_canvas_json': obj,
      'seats': this.seats
    }, {headers}).subscribe((data: any) => {
      // console.log(data)
      window.alert(data.message);
      this.notifier.notify('success', data.message)
    })
    // localStorage.setItem('panel', JSON.stringify(obj))
  }
}



// <table class="status-bar">
//   <tbody>
//     <tr class="status-bar-item">
//       <td>Type</td>
//       <td>Name</td>
//       <!-- <td>Left</td> -->
//       <!-- <td>Top</td> -->
//       <!-- <td>Rotation</td> -->
//       <!-- <td>Width</td> -->
//       <!-- <td>Height</td> -->
//       <td></td>
//       <td>Action</td>
//     </tr>
//     <tr class="status-bar-item" *ngFor="let selected of app.selections">
//       <td><strong *ngIf="selected.name">{{selected.name.split(':')[0] | titlecase}}</strong></td>
//       <td><strong *ngIf="selected.name">{{selected.name.split(':')[1]}}</strong></td>
//       <!-- <td><strong>{{selected.left | number:'1.2-2'}}</strong></td> -->
//       <!-- <td><strong>{{selected.top | number:'1.2-2'}}</strong></td> -->
//       <!-- <td><strong>{{selected.angle}}'</strong></td> -->
//       <!-- <td><strong>{{selected.width}}</strong></td> -->
//       <!-- <td><strong>{{selected.height}}</strong></td> -->
//       <td>
//         <strong *ngIf="selected.name.split(':')[0] == 'TABLE'">
//           {{selected._objects.length - 1}} Chairs
//         </strong>
//       </td>
//       <td>
//         <button mat-button matTooltip="edit information" color="primary" (click)="editObject(selected)">Edit </button>
//       </td>
//     </tr>
//   </tbody>
// </table>