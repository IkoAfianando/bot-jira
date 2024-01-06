const Imap = require('imap');
const nodemailer = require('nodemailer');

// Konfigurasi koneksi IMAP
const imapConfig = {
    user: 'email@example.com',
    password: 'password',
    host: 'imap.example.com',
    port: 993,
    tls: true,
};

// Konfigurasi pengiriman email
const emailConfig = {
    service: 'SMTP',
    auth: {
        user: 'email@example.com',
        pass: 'password',
    },
};

// Fungsi untuk mengirim notifikasi ke pengguna akhir
function kirimNotifikasiKePenggunaAkhir(penerima, subjek, isi) {
    const transporter = nodemailer.createTransport(emailConfig);

    const mailOptions = {
        from: 'email@example.com',
        to: penerima,
        subject: subjek,
        text: isi,
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error('Gagal mengirim email:', error);
        } else {
            console.log('Email berhasil dikirim:', info.response);
        }
    });
}

// Fungsi untuk memproses email yang diterima
function prosesEmailMasuk(email) {
    const subjek = email.headers.subject[0];
    const pengirim = email.headers.from[0].address;
    const isi = email.body;

    // Dapatkan informasi lain yang diperlukan dari email, misalnya ID tiket atau pengguna akhir

    // Kirim notifikasi ke pengguna akhir
    const penerima = 'pengguna@example.com'; // Ganti dengan alamat email pengguna akhir yang valid
    kirimNotifikasiKePenggunaAkhir(penerima, subjek, isi);
}

const functionCreateNumber = (value) => {
    return value + 1;
}

// Fungsi untuk mengambil email dari kotak surat
function fetchEmails() {
    const imap = new Imap(imapConfig);
    const data = functionCreateNumber(1);
    console.log(data)

    imap.once('ready', function () {
        imap.openBox('INBOX', true, function (err, box) {
            if (err) {
                console.error('Gagal membuka kotak surat:', err);
                return;
            }

            const searchCriteria = ['UNSEEN'];
            const fetchOptions = { bodies: '', markSeen: true };

            imap.search(searchCriteria, function (err, results) {
                if (err) {
                    console.error('Gagal mencari email:', err);
                    imap.end();
                    return;
                }

                const fetchEmails = imap.fetch(results, fetchOptions);

                fetchEmails.on('message', function (msg, seqno) {
                    msg.on('body', function (stream, info) {
                        let buffer = '';

                        stream.on('data', function (chunk) {
                            buffer += chunk.toString('utf8');
                        });

                        stream.on('end', function () {
                            const email = {
                                headers: Imap.parseHeader(buffer),
                                body: buffer,
                            };

                            console.log('Email diterima:', email);
                            prosesEmailMasuk(email);
                        });
                    });

                    msg.once('attributes', function (attrs) {
                        // Tandai email sebagai terbaca di sini jika diperlukan
                    });
                });

                fetchEmails.once('error', function (err) {
                    console.error('Gagal mengambil email:', err);
                });

                fetchEmails.once('end', function () {
                    imap.end();
                });
            });
        });
    });

    imap.once('error', function (err) {
        console.error('Kesalahan koneksi IMAP:', err);
    });

    imap.once('end', function () {
        console.log('Koneksi IMAP ditutup.');
    });

    imap.connect();
}

// Panggil fungsi fetchEmails untuk mengambil email secara berkala
setInterval(fetchEmails, 5000);
