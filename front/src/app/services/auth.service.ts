import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  isAuth$ = new BehaviorSubject<boolean>(false);
  private authToken = '';
  private userId = '';
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient,
              private router: Router) {}

  createUser(email: string, password: string) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/signup`, {email: email, password: password});
  }

  getToken() {
    return this.authToken;
  }

  getUserId() {
    return this.userId;
  }

  loginUser(email: string, password: string) {
    return this.http.post<{ userId: string, token: string }>(`${this.apiUrl}/auth/login`, {email: email, password: password}).pipe(
      tap(({ userId, token }) => {
        this.userId = userId;
        this.authToken = token;
        this.isAuth$.next(true);
      })
    );
  }

  logout() {
    this.authToken = '';
    this.userId = '';
    this.isAuth$.next(false);
    this.router.navigate(['login']);
  }

}
