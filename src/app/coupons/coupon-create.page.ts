import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import {
  Config,
  LoaderService,
  User,
  UserCouponCredit,
  UserCreateCouponPayload,
  UserCreatePayload,
  UserService
} from 'kng2-core';

@Component({
  selector: 'kio-coupon-create',
  templateUrl: './coupon-create.page.html',
  styleUrls: ['./coupon-create.page.scss'],
})
export class CouponCreatePage implements OnInit {
  isReady = false;
  isSaving = false;
  user: User;
  config: Config;
  coupon: UserCouponCredit | null = null;
  createdUser: User | null = null;
  error = '';
  createUser = false;

  form: UserCreateCouponPayload = {
    code: '',
    amount: null,
    constraint: ''
  };

  userForm: UserCreatePayload = {
    firstname: '',
    lastname: '',
    email: '',
    mobile: ''
  };

  constructor(
    private $loader: LoaderService,
    private $toast: ToastController,
    private $user: UserService
  ) {}

  ngOnInit() {
    const { config, user } = this.$loader.getLatestCoreData();
    this.config = config;
    this.user = user;
    this.onGenerateCode();
    this.isReady = true;
  }

  get canCreate(): boolean {
    return this.user && this.user.isAdmin();
  }

  onCreate() {
    if (!this.canCreate || this.isSaving) {
      return;
    }

    this.error = '';
    this.coupon = null;
    this.createdUser = null;

    if (!this.form.code) {
      this.error = "Le code du coupon est obligatoire.";
      return;
    }

    const amount = Number(this.form.amount);
    if (!Number.isInteger(amount)) {
      this.error = "Le montant doit être un nombre entier de centimes.";
      return;
    }

    if (amount < 100) {
      this.error = "Le montant minimum est de 100 centimes (1 CHF).";
      return;
    }

    const payload: UserCreateCouponPayload = {
      amount,
      code: (this.form.code || '').trim(),
      constraint: (this.form.constraint || '').trim() || undefined
    };

    if (this.createUser) {
      const userPayload = this.validateUserPayload();
      if (!userPayload) {
        return;
      }
      if (!payload.constraint) {
        payload.constraint = userPayload.email;
      }
      this.createUserAndCoupon(userPayload, payload);
      return;
    }

    this.createCoupon(payload);
  }

  private validateUserPayload(): UserCreatePayload | null {
    const payload: UserCreatePayload = {
      firstname: (this.userForm.firstname || '').trim(),
      lastname: (this.userForm.lastname || '').trim(),
      email: (this.userForm.email || '').trim().toLowerCase(),
      mobile: (this.userForm.mobile || '').trim()
    };

    if (payload.firstname.length < 2) {
      this.error = "Le prénom doit contenir au moins 2 caractères.";
      return null;
    }
    if (payload.lastname.length < 2) {
      this.error = "Le nom doit contenir au moins 2 caractères.";
      return null;
    }
    if (!payload.email || payload.email.indexOf('@') === -1) {
      this.error = "L'adresse e-mail n'est pas valide.";
      return null;
    }
    if (payload.mobile.length < 10) {
      this.error = "Le téléphone mobile doit être renseigné.";
      return null;
    }
    return payload;
  }

  private createUserAndCoupon(userPayload: UserCreatePayload, couponPayload: UserCreateCouponPayload) {
    this.isSaving = true;
    this.$user.createUser(userPayload).subscribe({
      next: user => {
        this.createdUser = user;
        this.createCoupon(couponPayload);
      },
      error: status => {
        this.isSaving = false;
        this.error = status.error || "L'utilisateur n'a pas pu être créé.";
        this.showToast(this.error, 'danger');
      }
    });
  }

  private createCoupon(payload: UserCreateCouponPayload) {
    this.isSaving = true;
    this.$user.createCoupon(payload).subscribe({
      next: coupon => {
        this.isSaving = false;
        this.coupon = coupon;
        this.showToast('Coupon créé');
      },
      error: status => {
        this.isSaving = false;
        this.error = status.error || "Le coupon n'a pas pu être créé.";
        this.showToast(this.error, 'danger');
      }
    });
  }

  onGenerateCode() {
    const year = new Date().getFullYear().toString().slice(-2);
    const bytes = new Uint8Array(3);
    window.crypto.getRandomValues(bytes);
    const token = Array.from(bytes)
      .map(value => value.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    this.form.code = `K${year}-${token.slice(0, 3)}-${token.slice(3)}`;
  }

  private showToast(message: string, color = 'primary') {
    this.$toast.create({
      message,
      duration: 2500,
      position: 'top',
      color
    }).then(alert => alert.present());
  }
}
