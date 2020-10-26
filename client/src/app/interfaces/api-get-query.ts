export interface ApiGetQuery {
  page: string;
  limit: string;
  fprop: string;
  fval: string;
  dtable: string;
  ctable: string;
  search: string | boolean;
  id?: string;
}
