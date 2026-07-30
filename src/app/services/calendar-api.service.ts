import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import {
  Booking,
  OwnerBlock,
  RateOverride,
  CreateBookingRequest,
  CreateBlockRequest,
  SetOverrideRequest,
  ReconcileResponse,
  ReconcileSummary,
  CalendarDay,
  CalendarResponse,
  // PropertySummary,
} from "../models/calendar.models";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: "root" })
export class CalendarApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getCalendar(start: string, end: string): Observable<CalendarDay[]> {
    return this.http
      .get<CalendarResponse>(`${this.baseUrl}/calendar`, { params: { start, end } })
      .pipe(map((response) => response.days));
  }

  getProperty(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/property`);
  }

  getBaseRate(): Observable<number> {
    return this.getProperty().pipe(map((property) => property.baseRate));
  }

  createBooking(req: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(`${this.baseUrl}/bookings`, req);
  }

  createBlock(req: CreateBlockRequest): Observable<OwnerBlock> {
    return this.http.post<OwnerBlock>(`${this.baseUrl}/blocks`, req);
  }

  removeBlock(startDate: string, endDate: string): Observable<{ removed: number }> {
    return this.http.delete<{ removed: number }>(`${this.baseUrl}/blocks`, {
      body: { startDate, endDate },
    });
  }

  setOverride(req: SetOverrideRequest): Observable<RateOverride> {
    return this.http.post<RateOverride>(`${this.baseUrl}/rates/override`, req);
  }

  reconcile(items: Array<{ id: string; guest: string; checkIn: string; checkOut: string }> = []): Observable<ReconcileResponse> {
    return this.http.post<ReconcileSummary>(`${this.baseUrl}/channel/reconcile`, { items }).pipe(
      map((summary) => ({
        success: true,
        result: {
          imported: summary.created.length + summary.updated.length + summary.unchanged.length,
          deduplicated: summary.duplicatesIgnored.length,
          rejected: summary.rejected.length,
          conflicts: summary.rejected.map((item) => ({
            startDate: item.checkIn,
            endDate: item.checkOut,
            guestName: item.guest,
            type: "booking",
          })),
          feedSource: "Channel feed",
          syncedAt: new Date().toISOString(),
        },
      })),
    );
  }
}
