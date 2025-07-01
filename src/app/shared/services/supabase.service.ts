import { Injectable } from '@angular/core';
import {createClient,SupabaseClient} from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  

  constructor() {
    this.supabase = createClient(
    environment.apiUrl,
    environment.publicAnonKey,
    );
  }

  get client() {
    return this.supabase;
  }
}
