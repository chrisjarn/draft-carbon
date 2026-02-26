import { db } from './database.js';
import 'dotenv/config';

// ── Raw data extracted from index.html ─────────────────────────────────
const CARBONITES = [
  // ── NSW · PARRAMATTA — Bookkeeping & CFO pod ──────────────
  { id:'c01', name:'Lena M.',      role:'Director',              seniority:7, state:'nsw', office:'parramatta',  location:null,               sl:'bkcfo', sg:'bkcfo-cfo', type:'FT', salary:185000, util:88,  pod:'NSW CFO Pod', entity:'ent-par',   isPartner:true, reportsTo:null },
  { id:'c02', name:'David K.',     role:'Senior Client Manager', seniority:5, state:'nsw', office:'parramatta',  location:'Working remotely',  sl:'bkcfo', sg:'bkcfo-cfo', type:'FT', salary:112000, util:79,  pod:'NSW CFO Pod', entity:'ent-par',   reportsTo:'c01' },
  { id:'c03', name:'Ryan C.',      role:'Bookkeeper',            seniority:2, state:'nsw', office:'parramatta',  location:null,               sl:'bkcfo', sg:'bkcfo-bk',  type:'PT', hoursPerWeek:25, salary:68000,  util:72,  pod:'NSW BKK Pod', entity:'ent-par',   reportsTo:'c04' },
  { id:'c04', name:'Jessica T.',   role:'Senior Bookkeeper',     seniority:3, state:'nsw', office:'parramatta',  location:null,               sl:'bkcfo', sg:'bkcfo-bk',  type:'FT', salary:82000,  util:84,  pod:'NSW BKK Pod', entity:'ent-par',   reportsTo:null },
  { id:'c05', name:'Wei L.',       role:'Payroll Specialist',    seniority:2, state:'nsw', office:'st-leonards', location:null,               sl:'bkcfo', sg:'bkcfo-pay', type:'FT', salary:72000,  util:91,  pod:'NSW Pay Pod', entity:'ent-stl',   reportsTo:null },

  // ── VIC · ELSTERNWICK — Accounting pod (no bookkeeping) ───
  { id:'c10', name:'Michelle M.',  role:'Associate Director',    seniority:8, state:'vic', office:'elsternwick', location:null,               sl:'acc',   sg:'acc-main',  type:'FT', salary:165000, util:91,  pod:'Elst Acc Pod', entity:'ent-els',  isPartner:true, reportsTo:null },
  { id:'c11', name:'James M.',     role:'Senior Accountant',     seniority:4, state:'vic', office:'elsternwick', location:null,               sl:'acc',   sg:'acc-main',  type:'FT', salary:95000,  util:82,  pod:'Elst Acc Pod', entity:'ent-els',  reportsTo:'c10' },
  { id:'c12', name:'Sophie R.',    role:'Accountant',            seniority:3, state:'vic', office:'elsternwick', location:null,               sl:'acc',   sg:'acc-main',  type:'FT', salary:72000,  util:78,  pod:'Elst Acc Pod', entity:'ent-els',  reportsTo:'c10' },
  // Elsternwick — Wealth pod
  { id:'c13', name:'Marc W.',      role:'Director (WEA)',        seniority:4, state:'vic', office:'elsternwick', location:null,               sl:'wm',    sg:null,        type:'FT', salary:185000, util:94,  pod:'Elst Wealth', entity:'ent-els',   isPartner:true, reportsTo:null },
  { id:'c14', name:'Priya M.',     role:'Senior Financial Planner',seniority:2,state:'vic', office:'elsternwick', location:null,              sl:'wm',    sg:null,        type:'FT', salary:110000, util:88,  pod:'Elst Wealth', entity:'ent-els',   reportsTo:'c13' },

  // ── VIC · MONASH — Bookkeeping & CFO pod ──────────────────
  { id:'c20', name:'Allison G.',   role:'Senior Manager (BKK)',  seniority:6, state:'vic', office:'monash',      location:null,               sl:'bkcfo', sg:'bkcfo-bk',  type:'PT', hoursPerWeek:30, salary:125000, util:70,  pod:'Monash Pod', entity:'ent-mon',    reportsTo:null },
  { id:'c21', name:'Tom K.',       role:'Senior Bookkeeper',     seniority:3, state:'vic', office:'monash',      location:null,               sl:'bkcfo', sg:'bkcfo-bk',  type:'FT', salary:82000,  util:76,  pod:'Monash Pod', entity:'ent-mon',    reportsTo:'c20' },
  { id:'c22', name:'Anika P.',     role:'Payroll Manager',       seniority:4, state:'vic', office:'monash',      location:null,               sl:'bkcfo', sg:'bkcfo-pay', type:'FT', salary:95000,  util:84,  pod:'Monash Pay', entity:'ent-mon',    reportsTo:null },

  // ── VIC · MORNINGTON — Bookkeeping pod ────────────────────
  { id:'c25', name:'Sam P.',       role:'Client Manager (BKK)',  seniority:4, state:'vic', office:'mornington',  location:'Mount Waverley',   sl:'bkcfo', sg:'bkcfo-bk',  type:'FT', salary:92000,  util:78,  pod:'Mornington Pod', entity:'ent-morn',reportsTo:null },
  { id:'c26', name:'Grace H.',     role:'Bookkeeper',            seniority:2, state:'vic', office:'mornington',  location:null,               sl:'bkcfo', sg:'bkcfo-bk',  type:'PT', hoursPerWeek:24, salary:64000,  util:65,  pod:'Mornington Pod', entity:'ent-morn',reportsTo:'c25' },

  // ── VIC · MOUNT WAVERLEY — Accounting pod ─────────────────
  { id:'c30', name:'David L.',     role:'Client Manager (ACC)',  seniority:5, state:'vic', office:'mount-waverley',location:null,             sl:'acc',   sg:'acc-main',  type:'FT', salary:108000, util:86,  pod:'Mt Waverley Pod', entity:'ent-mtwav',reportsTo:null },
  { id:'c31', name:'Kelly B.',     role:'Senior Accountant',     seniority:4, state:'vic', office:'mount-waverley',location:null,             sl:'acc',   sg:'acc-main',  type:'FT', salary:92000,  util:80,  pod:'Mt Waverley Pod', entity:'ent-mtwav',reportsTo:'c30' },

  // ── QLD · BRISBANE ────────────────────────────────────────
  { id:'c40', name:'Hayden R.',    role:'Associate Director',    seniority:8, state:'qld', office:'brisbane',    location:null,               sl:'acc',   sg:'acc-main',  type:'FT', salary:158000, util:87,  pod:'Bris Acc Pod', entity:'ent-bne',  isPartner:true, reportsTo:null },
  { id:'c41', name:'Sarah M.',     role:'Senior Accountant',     seniority:4, state:'qld', office:'brisbane',    location:null,               sl:'acc',   sg:'acc-main',  type:'FT', salary:94000,  util:82,  pod:'Bris Acc Pod', entity:'ent-bne',  reportsTo:'c40' },
  { id:'c42', name:'James T.',     role:'Accountant',            seniority:3, state:'qld', office:'brisbane',    location:null,               sl:'acc',   sg:'acc-main',  type:'FT', salary:70000,  util:75,  pod:'Bris Acc Pod', entity:'ent-bne',  reportsTo:'c40' },
  { id:'c43', name:'Crystal V.',   role:'Director (WEA)',        seniority:4, state:'qld', office:'brisbane',    location:null,               sl:'wm',    sg:null,        type:'FT', salary:175000, util:94,  pod:'Bris Wealth', entity:'ent-bne',   isPartner:true, reportsTo:null },
  { id:'c44', name:'Amy K.',       role:'Senior Bookkeeper',     seniority:3, state:'qld', office:'brisbane',    location:null,               sl:'bkcfo', sg:'bkcfo-bk',  type:'FT', salary:82000,  util:80,  pod:'Bris BKK Pod', entity:'ent-bne',  reportsTo:'c45' },
  { id:'c45', name:'Scott D.',     role:'Senior Manager (BKK)',  seniority:6, state:'qld', office:'brisbane',    location:null,               sl:'bkcfo', sg:'bkcfo-bk',  type:'FT', salary:135000, util:88,  pod:'Bris BKK Pod', entity:'ent-bne',  reportsTo:null },

  // ── QLD · TOOWOOMBA ───────────────────────────────────────
  { id:'c50', name:'Bob N.',       role:'Senior Manager (ACC)',  seniority:7, state:'qld', office:'toowoomba',   location:null,               sl:'acc',   sg:'acc-main',  type:'FT', salary:128000, util:85,  pod:'Toowoomba Pod', entity:'ent-too', reportsTo:null },
  { id:'c51', name:'Kate J.',      role:'Accountant',            seniority:3, state:'qld', office:'toowoomba',   location:null,               sl:'acc',   sg:'acc-main',  type:'PT', hoursPerWeek:20, salary:65000,  util:70,  pod:'Toowoomba Pod', entity:'ent-too', reportsTo:'c50' },
  { id:'c52', name:'Amy L.',       role:'Bookkeeper',            seniority:2, state:'qld', office:'bundaberg',   location:'Working remotely',  sl:'bkcfo', sg:'bkcfo-bk',  type:'PT', hoursPerWeek:24, salary:64000,  util:68,  pod:'QLD BKK Pod', entity:'ent-bun',  reportsTo:null },

  // ── WA · OSBORNE PARK ─────────────────────────────────────
  { id:'c60', name:'Todd Z.',      role:'Associate Director',    seniority:8, state:'wa',  office:'osborne-park',location:null,               sl:'acc',   sg:'acc-main',  type:'FT', salary:155000, util:80,  pod:'WA Acc Pod', entity:'ent-op1',    isPartner:true, reportsTo:null },
  { id:'c61', name:'Chris W.',     role:'Senior Accountant',     seniority:4, state:'wa',  office:'osborne-park',location:null,               sl:'acc',   sg:'acc-main',  type:'FT', salary:92000,  util:78,  pod:'WA Acc Pod', entity:'ent-op1',    reportsTo:'c60' },
  { id:'c62', name:'Priya S.',     role:'SMSF Manager',          seniority:1, state:'wa',  office:'osborne-park',location:null,               sl:'acc',   sg:'acc-smsf',  type:'FT', salary:102000, util:88,  pod:'WA SMSF Pod', entity:'ent-op1',   reportsTo:null },
  { id:'c63', name:'Luke M.',      role:'SMSF Manager',          seniority:1, state:'wa',  office:'osborne-park',location:'Swan Valley',       sl:'acc',   sg:'acc-smsf',  type:'FT', salary:98000,  util:82,  pod:'WA SMSF Pod', entity:'ent-op1',   reportsTo:'c62' },
  { id:'c64', name:'Kristen K.',   role:'Senior Bookkeeper',     seniority:3, state:'wa',  office:'osborne-park',location:null,               sl:'bkcfo', sg:'bkcfo-bk',  type:'PT', hoursPerWeek:28, salary:78000,  util:65,  pod:'WA BKK Pod', entity:'ent-cbk',    reportsTo:null },
  { id:'c65', name:'Grant T.',     role:'Senior Manager (BKK)',  seniority:6, state:'wa',  office:'osborne-park',location:null,               sl:'rd',    sg:null,        type:'FT', salary:145000, util:114, pod:'WA R&D Pod', entity:'ent-op1',    reportsTo:null },
  { id:'c66', name:'Ben A.',       role:'Loan Administrator',    seniority:1, state:'wa',  office:'osborne-park',location:null,               sl:'fin',   sg:null,        type:'FT', salary:65000,  util:72,  pod:'WA Finance Pod', entity:'ent-cbk',reportsTo:'c67' },
  { id:'c67', name:'Luke F.',      role:'Senior Financial Planner',seniority:2,state:'wa',  office:'osborne-park',location:null,              sl:'fin',   sg:null,        type:'FT', salary:110000, util:80,  pod:'WA Finance Pod', entity:'ent-cbk',reportsTo:null },
  { id:'c68', name:'Nicole B.',    role:'Financial Planner',     seniority:1, state:'wa',  office:'osborne-park',location:null,               sl:'wm',    sg:null,        type:'FT', salary:118000, util:108, pod:'WA Wealth Pod', entity:'ent-cbk', reportsTo:null },
  { id:'c69', name:'Dan R.',       role:'Account Manager (INS)', seniority:3, state:'wa',  office:'osborne-park',location:null,               sl:'ins',   sg:null,        type:'FT', salary:92000,  util:88,  pod:'WA Ins Pod', entity:'ent-op1',    reportsTo:null },
  { id:'c70', name:'Mei C.',       role:'Broker Assistant (INS)',seniority:1, state:'wa',  office:'osborne-park',location:null,               sl:'ins',   sg:null,        type:'PT', hoursPerWeek:16, salary:58000,  util:74,  pod:'WA Ins Pod', entity:'ent-op1',    reportsTo:'c69' },

  // ── SA · ADELAIDE ─────────────────────────────────────────
  { id:'c80', name:'David W.',     role:'Associate Director',    seniority:8, state:'sa',  office:'adelaide',    location:null,               sl:'acc',   sg:'acc-main',  type:'FT', salary:165000, util:86,  pod:'Adel Acc Pod', entity:'ent-adl',  isPartner:true, reportsTo:null },
  { id:'c81', name:'Don B.',       role:'Senior Manager (ACC)',  seniority:7, state:'sa',  office:'adelaide',    location:'Barossa',           sl:'acc',   sg:'acc-main',  type:'FT', salary:138000, util:78,  pod:'Adel Acc Pod', entity:'ent-adl',  reportsTo:'c80' },
  { id:'c82', name:'Zara K.',      role:'Senior Accountant',     seniority:4, state:'sa',  office:'adelaide',    location:null,               sl:'acc',   sg:'acc-main',  type:'FT', salary:92000,  util:84,  pod:'Adel Acc Pod', entity:'ent-adl',  reportsTo:'c81' },
  { id:'c83', name:'Gail R.',      role:'Financial Planning Manager',seniority:3,state:'sa',office:'adelaide',   location:null,               sl:'wm',    sg:null,        type:'FT', salary:128000, util:90,  pod:'Adel Wealth', entity:'ent-adl',   reportsTo:null },
  { id:'c84', name:'Nia J.',       role:'Client Services Officer',seniority:2,state:'sa',  office:'adelaide',    location:null,               sl:'wm',    sg:null,        type:'PT', salary:68000,  util:72,  pod:'Adel Wealth', entity:'ent-adl',   reportsTo:'c83' },
]

const ENTITIES = [
  // WA
  { id:'ent-op1',  biz:'CABC Osborne Park',               tan:'Carbon Accountants & Business Consultants',
    partners:['Clinton Gibson','James McNaught','Nathan Hood','Dom Papaluca','Wayne French'],
    officeId:'osborne-park', state:'wa', phone:'(08) 9446 8588',
    address:'24 Hasler Road, Osborne Park WA 6017', email:'info@carbongroup.com.au', sl:['acc','rd','ins'] },
  { id:'ent-op2',  biz:'CABC Osborne Park 2 (Kensington)', tan:'CABC Osborne Park 2',
    partners:['Wayne French'],
    officeId:'osborne-park', state:'wa', phone:'(08) 9446 8588',
    address:'24 Hasler Road, Osborne Park WA 6017', email:'accounting@carbongroup.com.au', sl:['acc'] },
  { id:'ent-cbk',  biz:'CBK Osborne Park',                tan:'Carbon Bookkeeping',
    partners:['Marc Wiriadisastra','Dale Ettridge'],
    officeId:'osborne-park', state:'wa', phone:'(08) 9446 8588',
    address:'24 Hasler Road, Osborne Park WA 6017', email:'bookkeeping@carbongroup.com.au', sl:['bkcfo','fin','wm'] },
  { id:'ent-fda',  biz:'Forrestdale',                     tan:'Carbon Parish',
    partners:['Jason Parish'],
    officeId:'osborne-park', state:'wa', phone:'(08) 6391 2100',
    address:'4/15 Alex Wood Dr, Forrestdale WA 6112', email:'forrestdale@carbongroup.com.au', sl:['bkcfo'] },
  { id:'ent-sv',   biz:'Swan Valley (Ellenbrook)',         tan:'Carbon Accountants Swan Valley',
    partners:['Michelle Maynard','Steve Wai','Todd Zani'],
    officeId:'swan-valley', state:'wa', phone:'(08) 6296 7788',
    address:'40 Ellen Stirling Parade, Ellenbrook WA 6069', email:'swanvalley@carbongroup.com.au', sl:['acc'] },
  { id:'ent-way',  biz:'Waypoint Corporate',              tan:'Waypoint Corporate',
    partners:['Marc Wiriadisastra','Dale Ettridge'],
    officeId:'osborne-park', state:'wa', phone:'(08) 9446 8588',
    address:'24 Hasler Road, Osborne Park WA 6017', email:'waypoint@carbongroup.com.au', sl:['bkcfo'] },
  // NSW
  { id:'ent-syd',  biz:'Sydney / Surry Hills',            tan:'CBK NSW',
    partners:['Wellington Takakura'],
    officeId:'parramatta', state:'nsw', phone:'(02) 8218 2126',
    address:'Upper Ground Floor, 55 Brisbane St, Surry Hills NSW 2010', email:'sydney@carbongroup.com.au', sl:['bkcfo'] },
  { id:'ent-stl',  biz:'St Leonards',                     tan:null,
    partners:['Wellington Takakura','Marc Wiriadisastra','Dale Ettridge'],
    officeId:'st-leonards', state:'nsw', phone:'(02) 9437 1785',
    address:'C106/11 Chandos Street, St Leonards NSW 2065', email:'cbknsw@carbongroup.com.au', sl:['bkcfo'] },
  { id:'ent-par',  biz:'Parramatta',                      tan:null,
    partners:[],
    officeId:'parramatta', state:'nsw', phone:null,
    address:'Suite 501, Level 5/55 Phillip Street, Parramatta NSW 2150', email:null, sl:['bkcfo'] },
  // VIC
  { id:'ent-morn', biz:'Mornington Peninsula',            tan:'Carbon Kapovic',
    partners:['Kate Kapovic'],
    officeId:'mornington', state:'vic', phone:'0415 091 609',
    address:'Suite 3b, 72 Blamey Place, Mornington VIC 3931', email:'Kate.k@carbongroup.com.au', sl:['bkcfo'] },
  { id:'ent-mtwav',biz:'Mount Waverley',                  tan:'CABC Mount Waverley',
    partners:['Igor Hnatko'],
    officeId:'mount-waverley', state:'vic', phone:'(03) 9887 8751',
    address:'631 High Street Road, Mount Waverley VIC 3149', email:'mtwaverley@carbongroup.com.au', sl:['acc'] },
  { id:'ent-mon',  biz:'Monash',                          tan:'Carbon Gardiner',
    partners:['Allison Gardiner','Maree Hornsby'],
    officeId:'monash', state:'vic', phone:'(03) 8582 2051',
    address:'Level 2 Unit 18, 15 Ricketts Rd, Mt Waverley VIC 3149', email:'monash@carbongroup.com.au', sl:['bkcfo'] },
  { id:'ent-els',  biz:'Elsternwick',                     tan:'CABC St Kilda',
    partners:['Mike Haberfield','George Kapiniaris','Les Silpert'],
    officeId:'elsternwick', state:'vic', phone:'(03) 9523 6500',
    address:'Suite 2/469 Glen Huntly Road, Elsternwick VIC 3185', email:'elsternwick@carbongroup.com.au', sl:['acc','wm'] },
  // QLD
  { id:'ent-bne',  biz:'Brisbane',                        tan:'CABC Brisbane',
    partners:['Anthony McPhee','Gail Rogerson','Samara Badgery'],
    officeId:'brisbane', state:'qld', phone:'(07) 3910 6200',
    address:'Level 8, 2 King Street, Fortitude Valley QLD 4006', email:'fortitudevalley@carbongroup.com.au', sl:['acc','bkcfo','wm'] },
  { id:'ent-bun',  biz:'Bundaberg',                       tan:'CABC Bundaberg',
    partners:['Anthony McPhee','Jesse Williamson'],
    officeId:'bundaberg', state:'qld', phone:'(07) 4153 3444',
    address:'4/290 Bourbong Street, Bundaberg West QLD 4670', email:'bundaberg@carbongroup.com.au', sl:['acc','bkcfo'] },
  { id:'ent-gym',  biz:'Gympie',                          tan:'CABC Gympie',
    partners:['Anthony McPhee','Inga Jarick','Shaun Ward'],
    officeId:'gympie', state:'qld', phone:'(07) 5482 1533',
    address:'28 Excelsior Road, Gympie QLD 4570', email:'gympie@carbongroup.com.au', sl:['acc'] },
  { id:'ent-frc',  biz:'Fraser Coast',                    tan:'CABC Bundaberg',
    partners:['Jesse Williamson','Anthony McPhee'],
    officeId:'fraser-coast', state:'qld', phone:'(07) 4184 9900',
    address:'Unit 25, 58-60 Torquay Rd, Pialba QLD 4655', email:'frasercoast@carbongroup.com.au', sl:['acc'] },
  { id:'ent-ips',  biz:'Ipswich',                         tan:'CABC Ipswich',
    partners:['Maria Kelly','Vicki Yorston','David Martin','Neil Harding'],
    officeId:'ipswich', state:'qld', phone:'(07) 3812 2233',
    address:'221 Brisbane Street, Ipswich QLD 4305', email:'ipswich@carbongroup.com.au', sl:['acc'] },
  { id:'ent-too',  biz:'Toowoomba',                       tan:'Carbon Toowoomba Pty Ltd',
    partners:['Bob Noye'],
    officeId:'toowoomba', state:'qld', phone:'(07) 4638 8022',
    address:'208 Herries Street, Toowoomba QLD 4350', email:'toowoomba@carbongroup.com.au', sl:['acc','bkcfo'] },
  // SA
  { id:'ent-adl',  biz:'Adelaide',                        tan:'CABC Adelaide',
    partners:['David Block'],
    officeId:'adelaide', state:'sa', phone:'(08) 8359 2299',
    address:'61-63 Carrington Street, Adelaide SA 5000', email:'adelaide@carbongroup.com.au', sl:['acc','wm'] },
  { id:'ent-gaw',  biz:'Gawler',                          tan:'Carbon Symes',
    partners:['Peter Caddy','Hans Van Heuven'],
    officeId:'gawler', state:'sa', phone:'(08) 8522 2633',
    address:'27 Twelfth Street, Gawler South SA 5118', email:'symes@carbongroup.com.au', sl:['acc'] },
  { id:'ent-pfd',  biz:'Parafield',                       tan:'CABC Adelaide',
    partners:['David Block','Fiona Crook','Sharyn Duck'],
    officeId:'parafield', state:'sa', phone:'(08) 8250 0035',
    address:'Parafield Airport, 9 Dakota Dr, Parafield SA 5106', email:'parafield@carbongroup.com.au', sl:['acc'] },
  { id:'ent-bar',  biz:'Barossa',                         tan:null,
    partners:['Anthony Puliatti'],
    officeId:'barossa', state:'sa', phone:null,
    address:'82A Murray Street, Tanunda SA 5352', email:'barossa@carbongroup.com.au', sl:['acc'] },
]

let HIRING_NEEDS = [
  { id:'h01', role:'Senior CFO Advisor',    sl:'bkcfo', sg:'bkcfo-cfo', state:'vic', office:'elsternwick',  location:'Elsternwick',  positions:2, type:'succession',      priority:'urgent',  status:'active',  salary_min:130000, salary_max:170000, target_start:'2025-10-01', approved_by:'Nathan Hood',   notes:'Two partners exiting end of FY. Cover until promoted internally.',   closed_how:null, closed_date:null, closed_name:null },
  { id:'h02', role:'Financial Planner',     sl:'wm',    sg:null,        state:'wa',  office:'osborne-park', location:'Osborne Park', positions:1, type:'growth',          priority:'urgent',  status:'active',  salary_min:110000, salary_max:145000, target_start:'2025-09-15', approved_by:'Nathan Hood',   notes:'Pipeline growth. Existing team at 94% utilisation.',                closed_how:null, closed_date:null, closed_name:null },
  { id:'h03', role:'R&D Grants Specialist', sl:'rd',    sg:null,        state:'vic', office:'monash',       location:'Monash',       positions:1, type:'new-capability',  priority:'urgent',  status:'active',  salary_min:95000,  salary_max:125000, target_start:'2025-10-01', approved_by:'Nathan Hood',   notes:'Sole specialist is a single-point-of-failure. Need depth.',         closed_how:null, closed_date:null, closed_name:null },
  { id:'h04', role:'SMSF Administrator',    sl:'acc',   sg:'acc-smsf',  state:'qld', office:'brisbane',     location:'Brisbane',     positions:1, type:'growth',          priority:'urgent',  status:'active',  salary_min:75000,  salary_max:95000,  target_start:'2025-09-01', approved_by:'Anthony McPhee',notes:'SMSF load at 137%. Client deliverables at risk.',                   closed_how:null, closed_date:null, closed_name:null },
  { id:'h05', role:'Payroll Officer',       sl:'bkcfo', sg:'bkcfo-pay', state:'sa',  office:'adelaide',     location:'Adelaide',     positions:1, type:'growth',          priority:'high',    status:'offer',   salary_min:65000,  salary_max:80000,  target_start:'2025-09-01', approved_by:'David Block',   notes:'Growing payroll client base SA. Offer extended — awaiting acceptance.',closed_how:null,closed_date:null, closed_name:null },
  { id:'h06', role:'Senior Accountant',     sl:'acc',   sg:'acc-main',  state:'qld', office:'ipswich',      location:'Ipswich',      positions:2, type:'growth',          priority:'high',    status:'active',  salary_min:85000,  salary_max:110000, target_start:'2025-11-01', approved_by:'Maria Kelly',   notes:'Entity expansion post-acquisition. Two roles approved.',            closed_how:null, closed_date:null, closed_name:null },
  { id:'h07', role:'Bookkeeper',            sl:'bkcfo', sg:'bkcfo-bk',  state:'nsw', office:'parramatta',   location:'Parramatta',   positions:1, type:'backfill',        priority:'high',    status:'open',    salary_min:60000,  salary_max:78000,  target_start:'2025-10-15', approved_by:'Wellington Takakura',notes:'Replacement headcount. Previous person resigned.',              closed_how:null, closed_date:null, closed_name:null },
  { id:'h08', role:'Insurance Advisor',     sl:'ins',   sg:null,        state:'wa',  office:'osborne-park', location:'Osborne Park', positions:1, type:'new-capability',  priority:'planned', status:'open',    salary_min:90000,  salary_max:120000, target_start:'2026-01-15', approved_by:'Nathan Hood',   notes:'Planned Q3 FY2026. Tied to new insurance product rollout.',          closed_how:null, closed_date:null, closed_name:null },
  { id:'h09', role:'Finance Broker',        sl:'fin',   sg:null,        state:'qld', office:'brisbane',     location:'Brisbane',     positions:1, type:'new-capability',  priority:'planned', status:'open',    salary_min:85000,  salary_max:115000, target_start:'2026-02-01', approved_by:'Anthony McPhee',notes:'New lending product launch. Budget conditional on Q2 revenue.',      closed_how:null, closed_date:null, closed_name:null },
  { id:'h10', role:'Associate Accountant',  sl:'acc',   sg:'acc-main',  state:'sa',  office:'gawler',       location:'Gawler',       positions:1, type:'growth',          priority:'planned', status:'open',    salary_min:58000,  salary_max:72000,  target_start:'2026-03-01', approved_by:'Peter Caddy',   notes:'Graduate pipeline initiative. University partnership hire.',         closed_how:null, closed_date:null, closed_name:null },
  { id:'h11', role:'Senior Bookkeeper',     sl:'bkcfo', sg:'bkcfo-bk',  state:'vic', office:'elsternwick',  location:'Elsternwick',  positions:1, type:'backfill',        priority:'high',    status:'closed',  salary_min:85000,  salary_max:105000, target_start:'2025-07-01', approved_by:'Mike Haberfield',notes:'Filled internally — Tom promoted from Accountant role.',            closed_how:'internal', closed_date:'2025-07-14', closed_name:'Tom K.' },
  { id:'h12', role:'Financial Planner',     sl:'wm',    sg:null,        state:'qld', office:'brisbane',     location:'Brisbane',     positions:1, type:'growth',          priority:'high',    status:'closed',  salary_min:95000,  salary_max:130000, target_start:'2025-06-01', approved_by:'Blair Milne',   notes:'Filled via recruiter referral.',                                    closed_how:'referral', closed_date:'2025-06-22', closed_name:'Amy S.' },
]

const POD_BUDGETS = {}

// ── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  // Check if already seeded
  const existing = await db.queryOne('SELECT COUNT(*) AS n FROM carbonites');
  if (parseInt(existing.n) > 0) {
    console.log(`⚠️  Database already has ${existing.n} carbonites. Skipping seed.`);
    console.log('   Run: node scripts/migrate.js --reset  to wipe and re-seed.');
    process.exit(0);
  }

  console.log('🌱 Seeding database...');

  // Seed carbonites
  for (const cb of CARBONITES) {
    await db.query(`
      INSERT INTO carbonites (id, name, role, sl, sg, state, office, pod, salary, type, seniority, location, hours, is_partner, reports_to, entity)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      ON CONFLICT (id) DO NOTHING`,
      [cb.id, cb.name, cb.role, cb.sl, cb.sg,
       cb.state, cb.office, cb.pod,
       cb.salary || 0, cb.type || 'FT',
       cb.seniority || 5, cb.location || null,
       cb.hours || null,
       cb.isPartner ?? false,
       cb.reportsTo || null,
       cb.entity || null]
    );
  }
  console.log(`  ✅ ${CARBONITES.length} Carbonites`);

  // Seed entities
  for (const ent of ENTITIES) {
    await db.query(`
      INSERT INTO entities (id, biz, tan, office_id, state, phone, address, email, sl, partners)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (id) DO NOTHING`,
      [ent.id, ent.biz, ent.tan || null, ent.officeId || null,
       ent.state || null, ent.phone || null, ent.address || null, ent.email || null,
       JSON.stringify(ent.sl || []),
       JSON.stringify(ent.partners || [])]
    );
  }
  console.log(`  ✅ ${ENTITIES.length} Entities`);

  // Seed hiring needs
  for (const h of HIRING_NEEDS) {
    await db.query(`
      INSERT INTO hiring_needs (id, role, sl, sg, state, office, location, positions, type, priority, status, salary_min, salary_max, target_start, approved_by, notes, closed_how, closed_date, closed_name)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      ON CONFLICT (id) DO NOTHING`,
      [h.id, h.role, h.sl, h.sg, h.state, h.office, h.location,
       h.positions || 1, h.type, h.priority, h.status || 'open',
       h.salary_min || null, h.salary_max || null, h.target_start || null,
       h.approved_by || null, h.notes || null,
       h.closed_how || null, h.closed_date || null, h.closed_name || null]
    );
  }
  console.log(`  ✅ ${HIRING_NEEDS.length} Hiring needs`);

  // Seed pod budgets
  if (Array.isArray(POD_BUDGETS)) {
    for (const b of POD_BUDGETS) {
      await db.query(`
        INSERT INTO pod_budgets (state, office, pod_name, budget)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (state, office, pod_name) DO NOTHING`,
        [b.state, b.office, b.pod_name, b.budget]
      );
    }
    console.log(`  ✅ ${POD_BUDGETS.length} Pod budgets`);
  }

  console.log('\n✅ Seed complete! Run: node server.js');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
