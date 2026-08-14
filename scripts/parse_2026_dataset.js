const fs = require('fs')
const path = require('path')

const CSV_DATA = `Aufbereitete Datenbasis;;;;;;;;;;;
;;;;;;;;;;;
Stand: 03.08.2026;;296.929 ?;;;;;;;85.264;;
Faktura NR.;Datum;Wert;Status;a;Kunden Nr.;Kundenname;Artikel;Artikelname;Stück;Agent;%
INTERCOM NTP;07.01.2026;?231,00 ;;;10343;INTERCOM NTP;35110;M-ONE Sanitar Silikon;24;Qerimi;0,17
INTERCOM NTP;1.7.2026;;;;10343;INTERCOM NTP;35121;M-ONE Sanitar Silikon;36;Qerimi;0,17
ERALP;1.7.2026;92,40 ?;;;10308;ERALP;35125;M-ONE Sanitar Silikon;24;Qerimi;0,17
TINA;1.7.2026;46,20 ?;;;10344;TINA;35108;M-ONE Sanitar Silikon;12;Qerimi;0,17
IBAK;1.7.2026;92,40 ?;;;10340;IBAK;35109;M-ONE Sanitar Silikon;24;Qerimi;0,17
PARKETI;1.7.2026;138,60 ?;;;10325;PARKETI;35110;M-ONE Sanitar Silikon;24;Qerimi;0,17
PARKETI;1.7.2026;;;;10325;PARKETI;35111;M-ONE Sanitar Silikon;12;Qerimi;0,17
BURIMI;1.7.2026;46,20 ?;;;10330;BURIMI;35109;M-ONE Sanitar Silikon;12;Qerimi;0,17
DARDANIA;1.7.2026;92,40 ?;;;10332;DARDANIA;35109;M-ONE Sanitar Silikon;12;Qerimi;0,17
DARDANIA;1.7.2026;;;;10332;DARDANIA;35110;M-ONE Sanitar Silikon;12;Qerimi;0,17
FUNDAMETI;1.7.2026;92,40 ?;;;10301;FUNDAMETI;35121;M-ONE Sanitar Silikon;12;Qerimi;0,17
FUNDAMETI;1.7.2026;;;;10301;FUNDAMETI;35119;M-ONE Sanitar Silikon;12;Qerimi;0,17
BEKA-3;1.7.2026;86,40 ?;;;10323;BEKA-3;50912;DICHTUNG;12;Qerimi;0,2
HAZROLLI;1.7.2026;46,20 ?;;;20301;HAZROLLI;35119;M-ONE Sanitar Silikon;12;Mensuri;0,17
BAU HOME;1.7.2026;73,80 ?;;;20324;BAU HOME;35121;M-ONE Sanitar Silikon;12;Mensuri;0,17
BAU HOME;1.7.2026;;;;20324;BAU HOME;51612;struktural akryl;12;Mensuri;0,06
CONDOR;1.7.2026;240,00 ?;;;20307;CONDOR;35108;M-ONE Sanitar Silikon;12;Mensuri;0,17
CONDOR;1.7.2026;;;;20307;CONDOR;35110;M-ONE Sanitar Silikon;12;Mensuri;0,17
CONDOR;1.7.2026;;;;20307;CONDOR;35111;M-ONE Sanitar Silikon;12;Mensuri;0,17
CONDOR;1.7.2026;;;;20307;CONDOR;35128;M-ONE Sanitar Silikon;12;Mensuri;0,17
CONDOR;1.7.2026;;;;20307;CONDOR;51612;struktural akryl;24;Mensuri;0,06
DURGUTI 3;1.7.2026;143,40 ?;;;20313;DURGUTI 3;35109;M-ONE Sanitar Silikon;12;Mensuri;0,17
DURGUTI 3;1.7.2026;;;;20313;DURGUTI 3;66701;PROFIMONT EXTREME;12;Mensuri;0,2
DURGUTI 3;1.7.2026;;;;20313;DURGUTI 3;51612;struktural akryl;12;Mensuri;0,06
BEREQETI;1.7.2026;73,80 ?;;;20321;BEREQETI;35121;M-ONE Sanitar Silikon;12;Mensuri;0,17
BEREQETI;1.7.2026;;;;20321;BEREQETI;51612;struktural akryl;12;Mensuri;0,06
AGRO-FARM;1.7.2026;142,20 ?;;;20304;AGRO-FARM;35111;M-ONE Sanitar Silikon;12;Mensuri;0,17
AGRO-FARM;1.7.2026;;;;20304;AGRO-FARM;37112;M ONE BLACK;240;Mensuri;0,05
NITA 3;1.7.2026;92,40 ?;;;20303;NITA 3;35108;M-ONE Sanitar Silikon;12;Mensuri;0,17
NITA 3;1.7.2026;;;;20303;NITA 3;35110;M-ONE Sanitar Silikon;12;Mensuri;0,17
FITIMI;1.7.2026;92,40 ?;;;20306;FITIMI;35109;M-ONE Sanitar Silikon;12;Mensuri;0,17
FITIMI;1.7.2026;;;;20306;FITIMI;35110;M-ONE Sanitar Silikon;12;Mensuri;0,17
SHEHU-A;1.7.2026;69,20 ?;;;20317;SHEHU-A;50912;DICHTUNG;6;Mensuri;0,2
SHEHU-A;1.7.2026;;;;20317;SHEHU-A;49644;beMAKER Rostlöser;6;Mensuri;0,2
SHEHU-A;1.7.2026;;;;20317;SHEHU-A;55718;M ONE MOTORSTART;4;Mensuri;0,2
UNIVERZAL;1.8.2026;46,20 ?;;;10413;UNIVERZAL;35109;M-ONE Sanitar Silikon;12;Qerimi;0,17
EURO COM;1.8.2026;56,20 ?;;;10430;EURO COM;54412;beMAKER Bremsen&Teile Reininger;5;Qerimi;0,2
EURO COM;1.8.2026;;;;10430;EURO COM;35109;M-ONE Sanitar Silikon;12;Qerimi;0,17
ENISI - H;1.8.2026;46,20 ?;;;10428;ENISI - H;35125;M-ONE Sanitar Silikon;12;Qerimi;0,17
VISARI HH;1.8.2026;92,40 ?;;;10412;VISARI HH;35112;M-ONE Sanitar Silikon;12;Qerimi;0,17
VISARI HH;1.8.2026;;;;10412;VISARI HH;35111;M-ONE Sanitar Silikon;12;Qerimi;0,17
AGRONI;1.8.2026;63,50 ?;;;10406;AGRONI;50912;DICHTUNG;5;Qerimi;0,2
AGRONI;1.8.2026;;;;10406;AGRONI;49644;beMAKER Rostlöser;5;Qerimi;0,2
AGRONI;1.8.2026;;;;10406;AGRONI;44001;Fettspray;5;Qerimi;0,2
CARRALEVA 2;1.9.2026;46,20 ?;;;10508;CARRALEVA 2;35109;M-ONE Sanitar Silikon;12;Qerimi;0,17
LONI;1.9.2026;68,50 ?;;;10509;LONI;50912;DICHTUNG;5;Qerimi;0,2
LONI;1.9.2026;;;;10509;LONI;56117;M ONE UBS;3;Qerimi;0,2
LONI;1.9.2026;;;;10509;LONI;49644;beMAKER Rostlöser;5;Qerimi;0,2
LONI;1.9.2026;;;;10509;LONI;44001;Fettspray;3;Qerimi;0,2
CARRALEVA 1;1.9.2026;120,00 ?;;;10504;CARRALEVA 1;35109;M-ONE Sanitar Silikon;24;Qerimi;0,17
CARRALEVA 1;1.9.2026;;;;10504;CARRALEVA 1;51612;struktural akryl;12;Qerimi;0,06
REAL COLOR 2;1.9.2026;92,40 ?;;;10507;REAL COLOR 2;35112;M-ONE Sanitar Silikon;12;Qerimi;0,17
REAL COLOR 2;1.9.2026;;;;10507;REAL COLOR 2;35113;M-ONE Sanitar Silikon;12;Qerimi;0,17
ARDI LIPJAN;1.9.2026;99,50 ?;;;10529;ARDI LIPJAN;50912;DICHTUNG;10;Qerimi;0,2
ARDI LIPJAN;1.9.2026;;;;10529;ARDI LIPJAN;49644;beMAKER Rostlöser;5;Qerimi;0,2
ARDI LIPJAN;1.9.2026;;;;10529;ARDI LIPJAN;55718;M ONE MOTORSTART;5;Qerimi;0,2
RACI;1.9.2026;162,00 ?;;;20501;RACI;66701;PROFIMONT EXTREME;12;Mensuri;0,2
RACI;1.9.2026;;;;20501;RACI;35111;M-ONE Sanitar Silikon;12;Mensuri;0,17
RACI;1.9.2026;;;;20501;RACI;35113;M-ONE Sanitar Silikon;12;Mensuri;0,17
HOXHA;1.9.2026;73,80 ?;;;20502;HOXHA;35109;M-ONE Sanitar Silikon;12;Mensuri;0,17
HOXHA;1.9.2026;;;;20502;HOXHA;51612;struktural akryl;12;Mensuri;0,06
LIRIDONA KLINE;1.9.2026;92,40 ?;;;20511;LIRIDONA KLINE;35109;M-ONE Sanitar Silikon;24;Mensuri;0,17
BERATI A.P. (1);1.9.2026;106,40 ?;;;20513;BERATI A.P. (1);50912;DICHTUNG;12;Mensuri;0,2
BERATI A.P. (1);1.9.2026;;;;20513;BERATI A.P. (1);56117;M ONE UBS;5;Mensuri;0,2
BENI;1.9.2026;58,00 ?;;;20409;BENI;55718;M ONE MOTORSTART;12;Mensuri;0,2
BENI;1.9.2026;;;;20409;BENI;50912;DICHTUNG;2;Mensuri;0,2
MEGI;1.9.2026;45,00 ?;;;20406;MEGI;49644;beMAKER Rostlöser;12;Mensuri;0,2
MEGI;1.9.2026;;;;20406;MEGI;55718;M ONE MOTORSTART;6;Mensuri;0,2
ALBANI;1.10.2026;92,40 ?;;;10636;ALBANI;35109;M-ONE Sanitar Silikon;12;Qerimi;0,17
ALBANI;1.10.2026;;;;10636;ALBANI;35110;M-ONE Sanitar Silikon;12;Qerimi;0,17
SABITI;1.10.2026;31,00 ?;;;10605;SABITI;54412;beMAKER Bremsen&Teile Reininger;5;Qerimi;0,2
SABITI;1.10.2026;;;;10605;SABITI;44001;Fettspray;6;Qerimi;0,2
KUJTA;1.10.2026;138,60 ?;;;10625;KUJTA;35113;M-ONE Sanitar Silikon;12;Qerimi;0,17
KUJTA;1.10.2026;;;;10625;KUJTA;35121;M-ONE Sanitar Silikon;12;Qerimi;0,17
KUJTA;1.10.2026;;;;10625;KUJTA;35125;M-ONE Sanitar Silikon;12;Qerimi;0,17
BECOLOR;1.10.2026;28,50 ?;;;10619;BECOLOR;56117;M ONE UBS;3;Qerimi;0,2
BECOLOR;1.10.2026;;;;10619;BECOLOR;38136;M ONE KLARLACK;3;Qerimi;0,15
BECOLOR;1.10.2026;;;;10619;BECOLOR;49644;beMAKER Rostlöser;6;Qerimi;0,2
TE LUTA;1.10.2026;46,20 ?;;;10617;TE LUTA;35115;M-ONE Sanitar Silikon;12;Qerimi;0,17
AGROLONDI;1.10.2026;92,40 ?;;;20602;AGROLONDI;35109;M-ONE Sanitar Silikon;12;Mensuri;0,17
AGROLONDI;1.10.2026;;;;20602;AGROLONDI;35111;M-ONE Sanitar Silikon;12;Mensuri;0,17
LTI;1.10.2026;92,40 ?;;;20623;LTI;35111;M-ONE Sanitar Silikon;12;Mensuri;0,17
LTI;1.10.2026;;;;20623;LTI;35121;M-ONE Sanitar Silikon;12;Mensuri;0,17
ILIRI QERAMIKA;1.10.2026;120,00 ?;;;20622;ILIRI QERAMIKA;35111;M-ONE Sanitar Silikon;12;Mensuri;0,17
ILIRI QERAMIKA;1.10.2026;;;;20622;ILIRI QERAMIKA;35113;M-ONE Sanitar Silikon;12;Mensuri;0,17
ILIRI QERAMIKA;1.10.2026;;;;20622;ILIRI QERAMIKA;51612;struktural akryl;12;Mensuri;0,06
ALMIRI QERAMIKA;1.10.2026;92,40 ?;;;20631;ALMIRI QERAMIKA;35109;M-ONE Sanitar Silikon;12;Mensuri;0,17
ALMIRI QERAMIKA;1.10.2026;;;;20631;ALMIRI QERAMIKA;35110;M-ONE Sanitar Silikon;12;Mensuri;0,17
UNIKA;1.10.2026;138,60 ?;;;20627;UNIKA;35112;M-ONE Sanitar Silikon;12;Mensuri;0,17
UNIKA;1.10.2026;;;;20627;UNIKA;35113;M-ONE Sanitar Silikon;12;Mensuri;0,17
UNIKA;1.10.2026;;;;20627;UNIKA;35115;M-ONE Sanitar Silikon;12;Mensuri;0,17
TE-SYLA;1.10.2026;121,20 ?;;;20606;TE-SYLA;35113;M-ONE Sanitar Silikon;12;Mensuri;0,17
TE-SYLA;1.10.2026;;;;20606;TE-SYLA;50912;DICHTUNG;6;Mensuri;0,2
TE-SYLA;1.10.2026;;;;20606;TE-SYLA;55718;M ONE MOTORSTART;6;Mensuri;0,2
TE-SYLA;1.10.2026;;;;20606;TE-SYLA;31903;M ONE CHROM SPRAY;6;Mensuri;0,15
F.V. SH.P.K. ;1.10.2026;154,60 ?;;;20607;F.V. SH.P.K. ;35113;M-ONE Sanitar Silikon;12;Mensuri;0,17
F.V. SH.P.K. ;1.10.2026;;;;20607;F.V. SH.P.K. ;35115;M-ONE Sanitar Silikon;12;Mensuri;0,17
F.V. SH.P.K. ;1.10.2026;;;;20607;F.V. SH.P.K. ;35121;M-ONE Sanitar Silikon;12;Mensuri;0,17
F.V. SH.P.K. ;1.10.2026;;;;20607;F.V. SH.P.K. ;49644;beMAKER Rostlöser;8;Mensuri;0,2
LONI;1.10.2026;92,40 ?;;;20608;LONI;35115;M-ONE Sanitar Silikon;12;Mensuri;0,17
LONI;1.10.2026;;;;20608;LONI;35121;M-ONE Sanitar Silikon;12;Mensuri;0,17
BULONI - SH;1.10.2026;92,40 ?;;;20624;BULONI - SH;35109;M-ONE Sanitar Silikon;12;Mensuri;0,17
BULONI - SH;1.10.2026;;;;20624;BULONI - SH;35125;M-ONE Sanitar Silikon;12;Mensuri;0,17
ARSIM;1.12.2026;46,20 ?;;;10105;ARSIM;35125;M-ONE Sanitar Silikon;12;Qerimi;0,17
KADIJOLLET;1.12.2026;117,40 ?;;;10111;KADIJOLLET;35110;M-ONE Sanitar Silikon;12;Qerimi;0,17
KADIJOLLET;1.12.2026;;;;10111;KADIJOLLET;35111;M-ONE Sanitar Silikon;12;Qerimi;0,17
KADIJOLLET;1.12.2026;;;;10111;KADIJOLLET;51611;universal akryl;12;Qerimi;0,06
KADIJOLLET;1.12.2026;;;;10111;KADIJOLLET;26736;M ONE HAFTGRUND;5;Qerimi;0,15
QELA;1.12.2026;43,90 ?;;;10114;QELA;50912;DICHTUNG;2;Qerimi;0,2
QELA;1.12.2026;;;;10114;QELA;55718;M ONE MOTORSTART;5;Qerimi;0,2
QELA;1.12.2026;;;;10114;QELA;49644;beMAKER Rostlöser;6;Qerimi;0,2
BESI COM;1.12.2026;92,40 ?;;;10103;BESI COM;35119;M-ONE Sanitar Silikon;12;Qerimi;0,17
BESI COM;1.12.2026;;;;10103;BESI COM;35109;M-ONE Sanitar Silikon;12;Qerimi;0,17
KENA COMERC;1.12.2026;107,40 ?;;;20109;KENA COMERC;35113;M-ONE Sanitar Silikon;12;Mensuri;0,17
KENA COMERC;1.12.2026;;;;20109;KENA COMERC;35128;M-ONE Sanitar Silikon;12;Mensuri;0,17
KENA COMERC;1.12.2026;;;;20109;KENA COMERC;51611;universal akryl;12;Mensuri;0,06
TECOL 2;1.12.2026;38,00 ?;;;20111;TECOL 2;38136;M ONE KLARLACK;12;Mensuri;0,15
TECOL 2;1.12.2026;;;;20111;TECOL 2;54412;beMAKER Bremsen&Teile Reininger;7;Mensuri;0,2
TECOL 2;1.12.2026;;;;20111;TECOL 2;39505;M ONE SILIKON SPRAY;2;Mensuri;0,2
LULI-C;1.12.2026;184,80 ?;;;20126;LULI-C;35109;M-ONE Sanitar Silikon;12;Mensuri;0,17
LULI-C;1.12.2026;;;;20126;LULI-C;35110;M-ONE Sanitar Silikon;12;Mensuri;0,17
LULI-C;1.12.2026;;;;20126;LULI-C;35111;M-ONE Sanitar Silikon;12;Mensuri;0,17
LULI-C;1.12.2026;;;;20126;LULI-C;35125;M-ONE Sanitar Silikon;12;Mensuri;0,17
CAMA BAU;1.12.2026;162,00 ?;;;20121;CAMA BAU;66701;PROFIMONT EXTREME;12;Mensuri;0,2
CAMA BAU;1.12.2026;;;;20121;CAMA BAU;35108;M-ONE Sanitar Silikon;12;Mensuri;0,17
CAMA BAU;1.12.2026;;;;20121;CAMA BAU;35113;M-ONE Sanitar Silikon;12;Mensuri;0,17
TERMO PROJEKT;1.12.2026;92,40 ?;;;20127;TERMO PROJEKT;35110;M-ONE Sanitar Silikon;24;Mensuri;0,17
KTHIMI;1.12.2026;92,40 ?;;;20104;KTHIMI;35113;M-ONE Sanitar Silikon;24;Mensuri;0,17
FORD BASHKIMI;1.12.2026;26,50 ?;;;40002;FORD BASHKIMI;54412;beMAKER Bremsen&Teile Reininger;12;Zentrale;0,2
FORD BASHKIMI;1.12.2026;;;;40002;FORD BASHKIMI;49644;beMAKER Rostlöser;1;Zentrale;0,2
ARSIMI;1.13.2026;184,80 ?;;;10258;ARSIMI;35109;M-ONE Sanitar Silikon;48;Qerimi;0,17
MONI 2;1.13.2026;92,40 ?;;;10210;MONI 2;35115;M-ONE Sanitar Silikon;12;Qerimi;0,17
MONI 2;1.13.2026;;;;10210;MONI 2;35121;M-ONE Sanitar Silikon;12;Qerimi;0,17
XHAFA;1.13.2026;73,80 ?;;;10205;XHAFA;35111;M-ONE Sanitar Silikon;12;Qerimi;0,17
XHAFA;1.13.2026;;;;10205;XHAFA;51612;struktural akryl;12;Qerimi;0,06
BEK TRADE;1.13.2026;184,80 ?;;;10245;BEK TRADE;35109;M-ONE Sanitar Silikon;24;Qerimi;0,17
BEK TRADE;1.13.2026;;;;10245;BEK TRADE;35115;M-ONE Sanitar Silikon;24;Qerimi;0,17
AB SHPK;1.13.2026;27,60 ?;;;10241;AB SHPK;51612;struktural akryl;12;Qerimi;0,06
ARPO;1.13.2026;120,00 ?;;;10240;ARPO;35110;M-ONE Sanitar Silikon;12;Qerimi;0,17
ARPO;1.13.2026;;;;10240;ARPO;35113;M-ONE Sanitar Silikon;12;Qerimi;0,17
ARPO;1.13.2026;;;;10240;ARPO;51612;struktural akryl;12;Qerimi;0,06
TE BESNIKU;1.13.2026;46,20 ?;;;10201;TE BESNIKU;35114;M-ONE Sanitar Silikon;12;Qerimi;0,17
TANI;1.13.2026;92,40 ?;;;20224;TANI;35110;M-ONE Sanitar Silikon;12;Mensuri;0,17
TANI;1.13.2026;;;;20224;TANI;35111;M-ONE Sanitar Silikon;12;Mensuri;0,17
LETAJ;1.13.2026;138,60 ?;;;20209;LETAJ;35109;M-ONE Sanitar Silikon;12;Mensuri;0,17
LETAJ;1.13.2026;;;;20209;LETAJ;35110;M-ONE Sanitar Silikon;12;Mensuri;0,17
LETAJ;1.13.2026;;;;20209;LETAJ;35112;M-ONE Sanitar Silikon;12;Mensuri;0,17
INOX 1;1.13.2026;73,80 ?;;;20211;INOX 1;35109;M-ONE Sanitar Silikon;12;Mensuri;0,17
INOX 1;1.13.2026;;;;20211;INOX 1;51612;struktural akryl;12;Mensuri;0,06
AFRIMI-AG;1.13.2026;138,60 ?;;;20203;AFRIMI-AG;35111;M-ONE Sanitar Silikon;12;Mensuri;0,17
AFRIMI-AG;1.13.2026;;;;20203;AFRIMI-AG;35113;M-ONE Sanitar Silikon;12;Mensuri;0,17
AFRIMI-AG;1.13.2026;;;;20203;AFRIMI-AG;35125;M-ONE Sanitar Silikon;12;Mensuri;0,17
TE BESIMI;1.13.2026;169,60 ?;;;20201;TE BESIMI;35109;M-ONE Sanitar Silikon;12;Mensuri;0,17
TE BESIMI;1.13.2026;;;;20201;TE BESIMI;35110;M-ONE Sanitar Silikon;12;Mensuri;0,17
TE BESIMI;1.13.2026;;;;20201;TE BESIMI;35111;M-ONE Sanitar Silikon;12;Mensuri;0,17
TE BESIMI;1.13.2026;;;;20201;TE BESIMI;51611;universal akryl;12;Mensuri;0,06
TE BESIMI;1.13.2026;;;;20201;TE BESIMI;50912;DICHTUNG;2;Mensuri;0,2
LULI-C;1.13.2026;45,00 ?;;;20126;LULI-C;39505;M ONE SILIKON SPRAY;15;Mensuri;0,2
CAMA BAU;1.13.2026;47,50 ?;;;20121;CAMA BAU;12000;BAU CLEAN;5;Mensuri;0,5
CAMA BAU;1.13.2026;;;;20121;CAMA BAU;12001;BAU CLEAN;5;Mensuri;0,3
ARBENI BIOBLIC;1.13.2026;249,00 ?;;;40003;ARBENI BIOBLIC;20001;BioBlic Universalreiniger;140;Zentrale;0,3
ARBENI BIOBLIC;1.13.2026;;;;40003;ARBENI BIOBLIC;30275;Blic Blic Sanitärreiniger;60;Zentrale;0,3
ERALP;1.14.2026;46,20 ?;;;10308;ERALP;35121;M-ONE Sanitar Silikon;12;Qerimi;0,17
BEKA-3;1.14.2026;36,00 ?;;;10323;BEKA-3;50912;DICHTUNG;5;Qerimi;0,2
GLOBAL NT;1.14.2026;46,20 ?;;;10357;GLOBAL NT;35113;M-ONE Sanitar Silikon;12;Qerimi;0,17
IBAK;1.14.2026;46,20 ?;;;10340;IBAK;35128;M-ONE Sanitar Silikon;12;Qerimi;0,17
MIRSADI;1.14.2026;184,80 ?;;;10366;MIRSADI;35109;M-ONE Sanitar Silikon;12;Qerimi;0,17
MIRSADI;1.14.2026;;;;10366;MIRSADI;35112;M-ONE Sanitar Silikon;12;Qerimi;0,17
MIRSADI;1.14.2026;;;;10366;MIRSADI;35121;M-ONE Sanitar Silikon;24;Qerimi;0,17
GLOBAL NT;1.14.2026;135,00 ?;;;10360;GLOBAL NT;35110;M-ONE Sanitar Silikon;12;Qerimi;0,17
GLOBAL NT;1.14.2026;;;;10360;GLOBAL NT;35125;M-ONE Sanitar Silikon;12;Qerimi;0,17
GLOBAL NT;1.14.2026;;;;10360;GLOBAL NT;51612;struktural akryl;12;Qerimi;0,06
GLOBAL NT;1.14.2026;;;;10360;GLOBAL NT;51611;universal akryl;12;Qerimi;0,06
SMIRA;1.14.2026;46,20 ?;;;10352;SMIRA;35109;M-ONE Sanitar Silikon;12;Qerimi;0,17
BEKA-1;1.14.2026;16,00 ?;;;10303;BEKA-1;56117;M ONE UBS;4;Qerimi;0,2
DARDANIA;1.14.2026;46,20 ?;;;10332;DARDANIA;35125;M-ONE Sanitar Silikon;12;Qerimi;0,17
BAU HOME;1.14.2026;46,20 ?;;;20324;BAU HOME;35110;M-ONE Sanitar Silikon;12;Mensuri;0,17
CONDOR;1.14.2026;299,00 ?;;;20307;CONDOR;35111;M-ONE Sanitar Silikon;24;Mensuri;0,17
CONDOR;1.14.2026;;;;20307;CONDOR;35112;M-ONE Sanitar Silikon;12;Mensuri;0,17
CONDOR;1.14.2026;;;;20307;CONDOR;66701;PROFIMONT EXTREME;12;Mensuri;0,2
CONDOR;1.14.2026;;;;20307;CONDOR;51612;struktural akryl;36;Mensuri;0,06
CONDOR;1.14.2026;;;;20307;CONDOR;49644;beMAKER Rostlöser;4;Mensuri;0,2
HAZROLLI;1.14.2026;73,80 ?;;;20301;HAZROLLI;35112;M-ONE Sanitar Silikon;12;Mensuri;0,17
HAZROLLI;1.14.2026;;;;20301;HAZROLLI;51612;struktural akryl;12;Mensuri;0,06
BARDHI-M;1.14.2026;277,20 ?;;;20331;BARDHI-M;35121;M-ONE Sanitar Silikon;24;Mensuri;0,17
BARDHI-M;1.14.2026;;;;20331;BARDHI-M;35110;M-ONE Sanitar Silikon;12;Mensuri;0,17
BARDHI-M;1.14.2026;;;;20331;BARDHI-M;35111;M-ONE Sanitar Silikon;12;Mensuri;0,17
BARDHI-M;1.14.2026;;;;20331;BARDHI-M;35113;M-ONE Sanitar Silikon;12;Mensuri;0,17
BARDHI-M;1.14.2026;;;;20331;BARDHI-M;35115;M-ONE Sanitar Silikon;12;Mensuri;0,17
BEREQETI;1.14.2026;138,60 ?;;;20321;BEREQETI;35109;M-ONE Sanitar Silikon;12;Mensuri;0,17
BEREQETI;1.14.2026;;;;20321;BEREQETI;35121;M-ONE Sanitar Silikon;24;Mensuri;0,17
AGRO-FARM;1.14.2026;136,00 ?;;;20304;AGRO-FARM;37112;M ONE BLACK;240;Mensuri;0,05
AGRO-FARM;1.14.2026;;;;20304;AGRO-FARM;50912;DICHTUNG;5;Mensuri;0,2
DURGUTI 3;1.14.2026;42,60 ?;;;20313;DURGUTI 3;51611;universal akryl;12;Mensuri;0,06
DURGUTI 3;1.14.2026;;;;20313;DURGUTI 3;51612;struktural akryl;12;Mensuri;0,06
SHEHU-A;1.14.2026;26,50 ?;;;20317;SHEHU-A;39505;M ONE SILIKON SPRAY;3;Mensuri;0,2
SHEHU-A;1.14.2026;;;;20317;SHEHU-A;44001;Fettspray;5;Mensuri;0,2
URA;1.14.2026;107,40 ?;;;20314;URA;35110;M-ONE Sanitar Silikon;24;Mensuri;0,17
URA;1.14.2026;;;;20314;URA;51611;universal akryl;12;Mensuri;0,06
ARBENI BIOBLIC;1.14.2026;158,00 ?;;;40003;ARBENI BIOBLIC;20001;BioBlic Universalreiniger;80;Zentrale;0,3
ARBENI BIOBLIC;1.14.2026;;;;40003;ARBENI BIOBLIC;30275;Blic Blic Sanitärreiniger;50;Zentrale;0,3`

function parseCustomDate(rawDate) {
  if (!rawDate) return new Date().toISOString()
  const clean = rawDate.trim()
  
  // Format DD.MM.YYYY
  const dmYMatch = clean.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (dmYMatch) {
    let p1 = parseInt(dmYMatch[1])
    let p2 = parseInt(dmYMatch[2])
    const year = dmYMatch[3]

    let month = p2
    let day = p1

    // If second number is > 12, then first is Month and second is Day (e.g. 1.13.2026, 7.31.2026)
    if (p2 > 12 || (p1 <= 12 && p2 <= 31 && clean.startsWith('1.') || clean.startsWith('2.') || clean.startsWith('3.') || clean.startsWith('4.') || clean.startsWith('5.') || clean.startsWith('6.') || clean.startsWith('7.') || clean.startsWith('8.'))) {
      // Month.Day.Year format from excel
      month = p1
      day = p2
    }

    const monthStr = month.toString().padStart(2, '0')
    const dayStr = day.toString().padStart(2, '0')
    return `${year}-${monthStr}-${dayStr}T10:00:00.000Z`
  }
  return new Date().toISOString()
}

function parseCurrency(str) {
  if (!str) return 0
  const clean = str.replace(/[^\d,.-]/g, '').replace(',', '.')
  return parseFloat(clean) || 0
}

function parseCSV(content) {
  const lines = content.split('\n')
  const orders = []
  let currentOrder = null
  let orderIndex = 1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith('Aufbereitete') || line.startsWith('Stand:') || line.startsWith('Faktura NR.')) {
      continue
    }

    const parts = line.split(';')
    if (parts.length < 10) continue

    const fakturaNrRaw = parts[0]?.trim()
    const datumRaw = parts[1]?.trim()
    const wertRaw = parts[2]?.trim()
    const custNoRaw = parts[5]?.trim()
    const custNameRaw = parts[6]?.trim() || fakturaNrRaw
    const skuRaw = parts[7]?.trim()
    const itemNameRaw = parts[8]?.trim()
    const qtyRaw = parseInt(parts[9]?.trim()) || 1
    const agentRaw = parts[10]?.trim()

    // Determine Driver & Vehicle
    let driverName = 'Zentrale'
    let vehicleLocationId = '11111111-1111-1111-1111-111111111111'
    let vehicleLocationName = 'Hauptlager Zentrale'

    if (agentRaw === 'Qerimi' || (custNoRaw && custNoRaw.startsWith('1'))) {
      driverName = 'Qerimi'
      vehicleLocationId = '33333333-3333-3333-3333-333333333333'
      vehicleLocationName = 'Fahrzeug 2 (Depo Qerimi)'
    } else if (agentRaw === 'Mensuri' || (custNoRaw && custNoRaw.startsWith('2'))) {
      driverName = 'Mensuri'
      vehicleLocationId = '22222222-2222-2222-2222-222222222222'
      vehicleLocationName = 'Fahrzeug 1 (Depo Mensuri)'
    } else if (agentRaw === 'Miloti' || (custNoRaw && custNoRaw.startsWith('3'))) {
      driverName = 'Miloti'
      vehicleLocationId = '11111111-1111-1111-1111-111111111111'
      vehicleLocationName = 'Hauptlager Zentrale'
    }

    const parsedWert = parseCurrency(wertRaw)
    const isNewInvoice = parsedWert > 0 || (datumRaw && fakturaNrRaw && (!currentOrder || currentOrder.customer_number !== custNoRaw || currentOrder.rawDate !== datumRaw))

    // Estimate item price
    let unitPrice = 4.20
    if (skuRaw === '50912') unitPrice = 7.20
    else if (skuRaw === '66701') unitPrice = 5.80
    else if (skuRaw === '51611' || skuRaw === '51612') unitPrice = 2.30
    else if (skuRaw === '49644') unitPrice = 2.50
    else if (skuRaw === '55718') unitPrice = 3.50
    else if (skuRaw === '44001') unitPrice = 2.50
    else if (skuRaw === '54412') unitPrice = 2.50
    else if (skuRaw === '56117') unitPrice = 4.00
    else if (skuRaw === '20001' || skuRaw === '30275') unitPrice = 1.80

    const item = {
      sku: skuRaw || '35110',
      name: itemNameRaw || 'M-ONE Sanitar Silikon',
      qty: qtyRaw,
      unit_price: unitPrice,
      total: Number((qtyRaw * unitPrice).toFixed(2))
    }

    if (isNewInvoice || !currentOrder) {
      const orderNumStr = orderIndex.toString().padStart(4, '0')
      orderIndex++

      currentOrder = {
        id: `sale-2026-${orderNumStr}`,
        order_number: `FK-2026-${orderNumStr}`,
        driver_name: driverName,
        vehicle_location_id: vehicleLocationId,
        vehicle_location_name: vehicleLocationName,
        customer_number: custNoRaw || '10103',
        customer_name: custNameRaw === '#NV' ? (fakturaNrRaw || 'Kunde') : (custNameRaw || fakturaNrRaw || 'Kunde'),
        total_amount: parsedWert || item.total,
        items: [item],
        payment_method: 'rechnung',
        created_at: parseCustomDate(datumRaw),
        rawDate: datumRaw,
      }
      orders.push(currentOrder)
    } else {
      // Append item to current order
      currentOrder.items.push(item)
      if (!parsedWert) {
        currentOrder.total_amount = Number((currentOrder.total_amount + item.total).toFixed(2))
      }
    }
  }

  return orders
}

const parsedOrders = parseCSV(CSV_DATA)
console.log('Total parsed 2026 orders:', parsedOrders.length)
console.log('Sample order 1:', JSON.stringify(parsedOrders[0], null, 2))
console.log('Sample order 5:', JSON.stringify(parsedOrders[4], null, 2))

const totalVolume = parsedOrders.reduce((s, o) => s + (o.total_amount || 0), 0)
console.log('Total Volume (€):', totalVolume.toFixed(2))

fs.writeFileSync(path.join(__dirname, '../lib/mock2026Sales.json'), JSON.stringify(parsedOrders, null, 2))
console.log('Successfully saved to lib/mock2026Sales.json!')
