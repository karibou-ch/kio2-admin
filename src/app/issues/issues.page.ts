import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportingService, ReportIssues, User } from 'kng2-core';
import { EngineService } from '../services/engine.service';

@Component({
  selector: 'app-issues',
  templateUrl: './issues.page.html',
  styleUrls: ['./issues.page.scss'],
})
export class IssuesPage implements OnInit {

  format = 'MMM yyyy';
  defaultTitle: string;
  user: User;
  pickerShippingDate: Date;
  currentDate: Date;
  month: number;
  year: number;

  reports: ReportIssues[];
  groups: any;
  items : any;

  constructor(
    private $engine: EngineService,
    private $report: ReportingService,
    private $route: ActivatedRoute,
    private $router: Router,
  ) {
    this.defaultTitle ='Suivi de la qualité';
    this.items = {};
  }

  set pickerShippingString(date: string){
    this.pickerShippingDate = new Date(date);
    this.pickerShippingDate.setHours(0,0,0,0);
  }

  get pickerShippingString(){
    return this.pickerShippingDate.toYYYYMMDD('-');
  }


  ngOnInit() {
    this.user = this.$engine.currentUser;
    this.pickerShippingDate = this.$engine.currentShippingDate;
    this.onInitReport();
  }

  //
  // on selected date
  onDatePicker(popover) {
    const date = (this.pickerShippingDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(2);

    this.currentDate = date;
    this.month = (this.currentDate.getMonth() + 1);
    this.year = (this.currentDate.getFullYear());
    this.$router.navigate(['/issues', this.month, this.year]);
    this.onInitReport();
    popover.dismiss();
  }

  //
  // return list of month.year labels for this report of issue
  get reportLabels() {
    return Object.keys(this.groups);
  }

  get itemsQty() {
    return Object.keys(this.items).sort(this.sortByQty.bind(this));
  }

  onInitReport() {
    this.reports = [];
    this.groups = {};
    this.items = {};
    const month = ('0' + (new Date(this.currentDate).getMonth() + 1)).slice(-2);
    const year = new Date(this.currentDate).getFullYear();

    //
    // this value depends on HUB
    // FIXME siteName not available on report
    // this.$report.getIssues(year, month)
    this.$report.getIssues().subscribe((reports: ReportIssues[]) => {
      // const mapped = {};
      // // tslint:disable-next-line: no-shadowed-variable
      // reports.forEach((report) => {
      //   if (!mapped[report._id.year]) { mapped[report._id.year] = {}; }
      //   if (!mapped[report._id.year][report._id.month]) { mapped[report._id.year][report._id.month] = {}; }
      //   if (!mapped[report._id.year][report._id.month][report._id.vendor]) {
      //     mapped[report._id.year][report._id.month][report._id.vendor] = {};
      //   }
      //   mapped[report._id.year][report._id.month][report._id.vendor] = (report.issues)
      // });
      document.title = this.defaultTitle;
      this.reports = reports.map(report => {
        const key = report._id.month+'.'+report._id.year;
        report['ratio'] = report.issues.length / report.orders.total;
        report['ratio_danger'] = report.issues.filter(elem => elem.issue == 'issue_missing_product_danger').length / report.orders.total;
        report['ratio_refund'] = report.issues.filter(elem => elem.issue == 'issue_wrong_product_quality').length / report.orders.total;

        //
        // create an array of missing items
        const items = report.issues.filter(elem => ['issue_wrong_product_quality','issue_missing_product_danger'].indexOf(elem.issue)>-1).map(issue => issue.title);
        items.forEach(item => {
          if(!this.items[item]) {
            this.items[item] = 0;
          }
          this.items[item] ++;

        });

        if(!this.groups[key]){
          this.groups[key] = [];
        }

        this.groups[key].push(report);
        return report;
      });//.sort(this.sortByRatio);

    });
  }
  
  sortByQty(a,b) {
    return this.items[b] - this.items[a];
  }

  sortByRatio(a, b) {
    const ratioa = a.issues.length / a.orders.total;
    const ratiob = b.issues.length / b.orders.total;
    return ratiob - ratioa;
  }
}
