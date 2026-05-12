<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use App\Libraries\EmailSender;
use App\Models\EmailCampaignLogModel;

class SendFinalMailing extends BaseCommand
{
    protected $group       = 'Promocion';
    protected $name        = 'email:send-final';
    protected $description = 'Envia el mailing de finalización de campaña.';
    protected $usage       = 'email:send-final --mode [test|mass] --email [email]';
    protected $arguments   = [];
    protected $options     = [
        '--mode'  => 'test (default) o mass',
        '--email' => 'Dirección de correo para el modo test',
    ];

    public function run(array $params)
    {
        $mode = CLI::getOption('mode') ?? 'test';
        $testEmail = CLI::getOption('email');

        $subject = "Tu premio está en camino! 🚚🔥";
        $title   = "Tu premio está en camino! 🚚🔥";
        $message = "La promoción \"Takis, la afición más intensa\" ha finalizado y tu canje ya se encuentra en proceso de entrega. Muy pronto lo recibirás en tu domicilio.<br><br>¡Gracias por tu paciencia y por vivir la intensidad con nosotros! 😎";

        if ($mode === 'test') {
            if (!$testEmail) {
                CLI::error("ERROR: En modo test debes especificar --email [email]");
                return;
            }

            CLI::write("Enviando prueba a: $testEmail");
            $success = EmailSender::sendEmail($testEmail, $subject, $title, $message);

            if ($success) {
                CLI::write(CLI::color("✅ Correo de prueba enviado con éxito.", "green"));
                $this->logEmail($testEmail, 'final_campaign_notice');
            } else {
                CLI::error("❌ Error al enviar el correo de prueba.");
            }
            return;
        }

        if ($mode === 'mass') {
            $emails = [
                "franciscochabcinta@gmail.com",
                "roselvisanchez2000@gmail.com",
                "jazz990821@gmail.com",
                "mxdhalexi@gmail.com",
                "lopezjeremias1394@gmail.com",
                "aascenciomazariego941@gmail.com",
                "ferchitotrejito8@gmail.com",
                "axelgiovannizuvi@hotmail.com",
                "mariesmemedoza@gmail.com",
                "luis2407mata@gmail.com",
                "danielfabila99@gmail.com",
                "marioarteaga3006@gmail.com",
                "papitas725@gmail.com",
                "sg182883@gmail.com",
                "bentbraun817@gmail.com",
                "covenant.payo@gmail.com",
                "crisjaramedina@gmail.com",
                "carefullyandjuandiego@gmail.com",
                "sandovalp619@gmail.com",
                "giangeles@hotmail.com",
                "aldoeleazarinchaurigue@gmail.com",
                "ovandojosedanielperea@gmail.com",
                "alemayin49@gmail.com",
                "axelh0630@gmail.com",
                "moiseshernandezperez798@gmail.com",
                "mike941114@gmail.com",
                "al6912391@gmail.com",
                "nancropa@gmail.com",
                "a.rojas1190@gmail.com",
                "gaxel9817@gmail.com",
                "anistar1593@gmail.com",
                "arathyremi@gmail.com",
                "cesarbiponce@gmail.com",
                "jesusgongora072000@gmail.com",
                "luviacoutino672@gmail.com",
                "narukusg@gmail.com",
                "mendozaliz1617@gmail.com",
                "arajimenezz10@gmail.com",
                "jhonnyvazquez751@gmail.com",
                "natasha.mendez.valencia1@gmail.com",
                "basadarney0326@gmail.com",
                "kwonwex@gmail.com",
                "mayramontiel709@gmail.com",
                "vanessa.000.jm@gmail.com",
                "lxelhuatecalero582@gmail.com",
                "lukaz_gonzalez_2004@hotmail.com",
                "roxanasanchez8373@gmail.com",
                "angeldomingueztdjesus@gmail.com",
                "jonathanarcosurbina@gmail.com",
                "nycobeltran0103@gmail.com",
                "aorta8880@gmail.com",
                "diegosantamaria1212@gmail.com",
                "natanaelcastaneda889@gmail.com",
                "caar2904@gmail.com",
                "jesusantoniomendozajuarez@gmail.com",
                "ing.lmarquez22@gmail.com",
                "abelromomolina@gmail.com",
                "adriangimenez820@gmail.com",
                "sebas02escob@hotmail.com",
                "lfeb5214@gmail.com",
                "buenapromoenlinea@gmail.com",
                "toscanodaniel45678@gmail.com",
                "js1779687@gmail.com",
                "figueros2026@outlook.com",
                "jr10746501@gmail.com",
                "isamaniego9512@gmail.com",
                "Alaskacuate@gmail.com",
                "magally0884@gmail.com",
                "josej141108@gmail.com",
                "valdezrayo@gmail.com",
                "evelynrespaldoflo@gmail.com",
                "carolinacorral0409@gmail.com",
                "silvestresalvador732@gmail.com",
                "abril.aranzamg@gmail.com",
                "angeldavidgarcia67974@gmail.com",
                "ventas.zeus7@gmail.com",
                "anahicarrillo1002@gmail.com",
                "azdiel136@gmail.com",
                "zuryzaray95120@gmail.com",
                "zal856adin@hotmail.com",
                "fidelinadiaz564@gmail.com",
                "eduardbond139@gmail.com",
                "galygonzalez719@gmail.com",
                "luismartinez1alcantar@gmail.com",
                "muszhucruz@gmail.com",
                "mogosvisual@gmail.com",
                "tacosdesuadero.69.2.0@gmail.com",
                "jesus_elias85@hotmail.com",
                "soyundinosauriorar@gmail.com",
                "josehh199023@gmail.com",
                "luisrascon656@gmail.com",
                "jvsm79@gmail.com",
                "anidelgadillo8072001@gmail.com",
                "eduardovare01@gmail.com",
                "by4lexmendez@gmail.com",
                "cesar.acmariscal@gmail.com",
                "mixexpana@gmail.com",
                "eduardocaco1950@gmail.com",
                "obezzin@gmail.com",
                "salasithai83@gmail.com",
                "beltranaguilardanieldaniel@gmail.com",
                "cuupuul@gmail.com",
                "jesusrosasnaranjo@gmail.com",
                "pepejonson5678@gmail.com",
                "marcososorio633@gmail.com",
                "gloria290698@gmail.com",
                "fundadora1.herbalife@gmail.com",
                "perezsmarisa@gmail.com",
                "olveraemanuel649@gmail.com",
                "ferreterianavarro32@gmail.com",
                "octavio.jorge@hotmail.com",
                "miiaa238m@gmail.com",
                "paassz135@gmail.com",
                "lupitabacab023@gmail.com",
                "kevinnn339@gmail.com",
                "emmanuelucho7@gmail.com",
                "lu_tpd.cris@hotmail.com",
                "cdrm7410@gmail.com",
                "jonatan.salnie@gmail.com",
                "feyo63@hotmail.com",
                "davidvid11san301@gmail.com",
                "rjazmincasas@icloud.com",
                "trinity27sonia@gmail.com",
                "zero31721@gmail.com",
                "peppaavina@gmail.com",
                "zero31721@gmail.com",
                "laramartinezoscar986@gmail.com",
                "ximena.gtz.04@icloud.com",
                "castellanoserick831@gmail.com",
                "ec126215@gmail.com",
                "monse_9901@outlook.com",
                "lukiale23@gmail.com",
                "miguelreynoso091233@gmail.com",
                "andres_jbautista@hotmail.com",
                "cesargustavobasurtobanda@gmail.com",
                "alejandrojimen3z456@gmail.coM",
                "kalixto17@gmail.com",
                "yahirverdugo011@gmail.com",
                "carretoarias@gmail.com",
                "willymedinaa123@gmail.com",
                "alan23fac@gmail.com",
                "jhoana098lopez@gmail.com",
                "sjsg.gcwmsh.s.k.s.s.z@gmail.com",
                "hulklioc@hotmail.com",
                "fernandomaldonadobio@gmail.com",
                "lunncriss24@gmail.com",
                "jose_ralf@hotmail.com",
                "kasha638291@gmail.com",
                "Carlosraymundob@gmail.com",
                "Carlosraymundob@gmail.com",
                "Pepetronjuarez@gmail.com",
                "amartid21972@gmail.com",
                "danrit.86@gmail.com",
                "lukiale23@gmail.com",
                "18171223@itculiacan.edu.mx",
                "jesusrosasnaranjo@gmail.com",
                "moncemtz690@gmail.com",
                "s74247293@gmail.com",
                "moralesluisroberto4@gmail.com",
                "hileriox@gmail.com",
                "jamilethuerta97@gmail.com",
                "cristinamerin65@gmail.com",
                "vega7707mend@gmail.com",
                "tulerosi874@gmail.com",
                "jardinesa343@gmail.com",
                "yoshaydejesus@gmail.com",
                "paulinaadileneespinosarivas@gmail.com",
                "voltaxd@gmail.com",
                "ef182583@gmail.com",
                "blanca15_luna@hotmail.com",
                "montondb@gmail.com",
                "albinasolorzano@gmail.com",
                "israherrera2613@gmail.com",
                "dragao.branco.de.olhos.azus@gmail.com",
                "gyiller10@gmail.com",
                "anaioya@outlook.com",
                "yireholve@gmail.com",
                "angelfullyt@gmail.com",
                "anadalia286@gmail.com",
                "lukiale23@gmail.com",
                "arnol_escamilla@hotmail.com",
                "israherrera2613@gmail.com",
                "jcruzpeyret@gmail.com",
                "javimarcafra@outlook.com",
                "karlapato86@gmail.com",
                "crisjaramedina@gmail.com",
                "cuupuul@gmail.com",
                "jlluisito28@gmail.com",
                "aarleth_star@live.com.mx",
                "aranrrz1213@gmail.com",
                "mely20.bvale@gmail.com",
                "pechhenrik@gmail.com",
                "m1dn1ght.styl3@gmail.com",
                "arlethlopez0206@gmail.com",
                "lemawis500@vecrose.com",
                "arlethlopez0206@gmail.com",
                "arlethlopez0206@gmail.com",
                "gabinoflo@gmail.com",
                "wiskasproxy202@gmail.com",
                "aishlinvargasc@gmail.com",
                "romanf726@gmail.com",
                "jansegura11@icloud.com",
                "jansegura11@icloud.com",
                "jansegura11@icloud.com",
                "jansegura11@icloud.com",
                "egyomar1989@gmail.com",
                "karengael14@gmail.com",
                "amaresc.1603@outlook.com",
                "i.n.t.r.ep.i.dnmw@gmail.COM",
                "navarreteu176@gmail.com",
                "elyorch997@gmail.com",
                "dianabpalma919@gmail.com",
                "jesuseladio23@gmail.com",
                "eth.orl10v@gmail.com",
                "jesusdgc252@gmail.com",
                "lukiale23@gmail.com",
                "a2536@cezama.edu.mx",
                "santiagotecru@gmail.com",
                "hdezjessenia95@gmail.com",
                "lupitabacab023@gmail.com",
                "tamallamine785@gmail.com",
                "israherrera2613@gmail.com",
                "tania.s_valladares@hotmail.com",
                "uh164379@gmail.com",
                "g.a.llgr.ice.l.a@gmail.com",
                "franckalina@hotmail.com",
                "claudiaretac@gmail.com",
                "andyrocki333@gmail.com",
                "cmgp8522@gmail.com",
                "cmgp8522@gmail.com",
                "fernyrubijane@gmail.com",
                "lukiale23@gmail.com",
                "zacksnyders802@gmail.com",
                "joseramonb23@hotmail.com",
                "stefanybrenda892@gmail.com",
                "alanjos_07@hotmail.com",
                "bugfan1@hotmail.com",
                "javi.to.s@hotmail.com",
                "JOELVALDIVIA5@HOTMAIL.COM",
                "jeanet.r88@gmail.com",
                "lupitabacab023@gmail.com",
                "montufargiljuancarlos@gmail.com",
                "urbinayael1@gmail.com",
                "stefanoollivier@gmail.com",
            ];

            CLI::write("--- INICIO DE ENVÍO MASIVO (FINALIZACIÓN) ---");
            CLI::write("Total de correos a enviar: " . count($emails));

            $totalSent = 0;
            foreach ($emails as $email) {
                CLI::write("Enviando a: $email ...");
                $success = EmailSender::sendEmail($email, $subject, $title, $message);
                if ($success) {
                    $totalSent++;
                    $this->logEmail($email, 'final_campaign_notice');
                    CLI::write(CLI::color("✅ Enviado", "green"));
                } else {
                    CLI::error("❌ Falló envío a $email");
                }
                // Small delay to avoid SMTP limits
                usleep(250000); // 250ms
            }

            CLI::write("--- FIN DEL PROCESO ---");
            CLI::write("Total enviados con éxito: " . $totalSent);
        }
    }

    private function logEmail($email, $type)
    {
        // 1. JSON LOG (FALLBACK)
        try {
            $logDir = WRITEPATH . 'logs/';
            if (!is_dir($logDir)) mkdir($logDir, 0777, true);
            $logFile = $logDir . 'email_final_campaign.json';
            $logData = [];
            if (file_exists($logFile)) {
                $logData = json_decode(file_get_contents($logFile), true) ?? [];
            }
            $logData[] = [
                'email'         => $email,
                'campaign_type' => $type,
                'sent_at'       => date('Y-m-d H:i:s')
            ];
            file_put_contents($logFile, json_encode($logData, JSON_PRETTY_PRINT));
        } catch (\Exception $e) {}

        /* 
        // 2. DATABASE LOG (MAIN)
        try {
            $model = new EmailCampaignLogModel();
            $model->insert([
                'email'         => $email,
                'campaign_type' => $type,
                'sent_at'       => date('Y-m-d H:i:s')
            ]);
        } catch (\Throwable $e) {
            // Fail silently to keep mailing loop going
        }
        */
    }
}
