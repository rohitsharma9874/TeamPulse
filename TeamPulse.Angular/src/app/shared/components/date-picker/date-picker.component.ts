import { Component, Input, forwardRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface CalDay {
  day: number;
  dateStr: string;
  disabled: boolean;
  otherMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DatePickerComponent),
    multi: true,
  }],
})
export class DatePickerComponent implements ControlValueAccessor {
  @Input() min?: string;
  @Input() max?: string;
  @Input() placeholder = 'Select date';
  @Input() hasError = false;

  value = '';
  isOpen = false;
  viewMode: 'day' | 'month' | 'year' = 'day';
  viewYear  = new Date().getFullYear();
  viewMonth = new Date().getMonth();
  decadeStart = Math.floor(new Date().getFullYear() / 10) * 10;

  readonly months     = MONTHS;
  readonly monthShort = MONTH_SHORT;
  readonly weekdays   = WEEKDAYS;

  private _onChange: (v: string) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(v: string): void {
    this.value = v ?? '';
    if (v) {
      const d = new Date(v + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        this.viewYear  = d.getFullYear();
        this.viewMonth = d.getMonth();
      }
    }
  }

  registerOnChange(fn: (v: string) => void): void { this._onChange = fn; }
  registerOnTouched(fn: () => void): void { this._onTouched = fn; }

  get displayValue(): string {
    if (!this.value) return '';
    const [y, m, d] = this.value.split('-');
    return `${d}/${m}/${y}`;
  }

  toggle(e: MouseEvent): void {
    e.stopPropagation();
    if (this.isOpen) {
      this.closePanel();
    } else {
      if (!this.value) {
        const now = new Date();
        this.viewYear  = now.getFullYear();
        this.viewMonth = now.getMonth();
      }
      this.viewMode = 'day';
      this.isOpen = true;
    }
  }

  closePanel(): void {
    this.isOpen = false;
    this._onTouched();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.isOpen) this.closePanel(); }

  // ── Day view ────────────────────────────────────────────────

  get calendarDays(): CalDay[] {
    const todayStr    = new Date().toISOString().split('T')[0];
    const firstDow    = new Date(this.viewYear, this.viewMonth, 1).getDay();
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const days: CalDay[] = [];

    const prevYear   = this.viewMonth === 0 ? this.viewYear - 1 : this.viewYear;
    const prevMonth  = this.viewMonth === 0 ? 11 : this.viewMonth - 1;
    const daysInPrev = new Date(prevYear, prevMonth + 1, 0).getDate();
    for (let i = firstDow - 1; i >= 0; i--) {
      const day = daysInPrev - i;
      days.push({ day, dateStr: this._str(prevYear, prevMonth, day), disabled: true, otherMonth: true, isSelected: false, isToday: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = this._str(this.viewYear, this.viewMonth, day);
      const disabled = (!!this.min && dateStr < this.min) || (!!this.max && dateStr > this.max);
      days.push({ day, dateStr, disabled, otherMonth: false, isSelected: dateStr === this.value, isToday: dateStr === todayStr });
    }

    const nextYear  = this.viewMonth === 11 ? this.viewYear + 1 : this.viewYear;
    const nextMonth = this.viewMonth === 11 ? 0 : this.viewMonth + 1;
    let nextDay = 1;
    while (days.length < 42) {
      days.push({ day: nextDay, dateStr: this._str(nextYear, nextMonth, nextDay++), disabled: true, otherMonth: true, isSelected: false, isToday: false });
    }

    return days;
  }

  selectDay(d: CalDay): void {
    if (d.disabled) return;
    this.value = d.dateStr;
    const parts = d.dateStr.split('-');
    this.viewYear  = +parts[0];
    this.viewMonth = +parts[1] - 1;
    this._onChange(this.value);
    this.closePanel();
  }

  prevMonth(): void {
    if (this.viewMonth === 0) { this.viewMonth = 11; this.viewYear--; }
    else this.viewMonth--;
  }

  nextMonth(): void {
    if (this.viewMonth === 11) { this.viewMonth = 0; this.viewYear++; }
    else this.viewMonth++;
  }

  // ── Month view ──────────────────────────────────────────────

  switchToMonth(): void { this.viewMode = 'month'; }

  selectMonth(m: number): void {
    this.viewMonth = m;
    this.viewMode  = 'day';
  }

  isMonthDisabled(m: number): boolean {
    const lastDay = new Date(this.viewYear, m + 1, 0).getDate();
    return (!!this.max && this._str(this.viewYear, m, 1) > this.max) ||
           (!!this.min && this._str(this.viewYear, m, lastDay) < this.min);
  }

  isMonthSelected(m: number): boolean {
    if (!this.value) return false;
    const [y, mo] = this.value.split('-');
    return +y === this.viewYear && +mo - 1 === m;
  }

  // ── Year view ───────────────────────────────────────────────

  switchToYear(): void {
    this.decadeStart = Math.floor(this.viewYear / 10) * 10;
    this.viewMode = 'year';
  }

  get calendarYears(): number[] {
    const years: number[] = [];
    for (let y = this.decadeStart; y < this.decadeStart + 10; y++) years.push(y);
    return years;
  }

  selectYear(y: number): void {
    this.viewYear = y;
    this.viewMode = 'month';
  }

  prevDecade(): void { this.decadeStart -= 10; }
  nextDecade(): void { this.decadeStart += 10; }

  isYearDisabled(y: number): boolean {
    return (!!this.max && this._str(y, 0, 1) > this.max) ||
           (!!this.min && this._str(y, 11, 31) < this.min);
  }

  private _str(y: number, m: number, d: number): string {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
}
