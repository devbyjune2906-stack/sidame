// Daftar kabupaten/kota resmi per provinsi (per pemekaran Papua 2022).
// Nama provinsi harus cocok persis dengan PROVINSI_LIST di db/seed.ts.
export const KABUPATEN_KOTA_BY_PROVINSI: Record<string, { kab: string[]; kota: string[] }> = {
  Aceh: {
    kab: [
      "Aceh Selatan", "Aceh Tenggara", "Aceh Timur", "Aceh Tengah", "Aceh Barat",
      "Aceh Besar", "Pidie", "Bireuen", "Aceh Utara", "Simeulue",
      "Aceh Singkil", "Bener Meriah", "Pidie Jaya", "Aceh Jaya", "Nagan Raya",
      "Aceh Barat Daya", "Gayo Lues", "Aceh Tamiang",
    ],
    kota: ["Banda Aceh", "Sabang", "Langsa", "Lhokseumawe", "Subulussalam"],
  },
  "Sumatera Utara": {
    kab: [
      "Tapanuli Tengah", "Tapanuli Utara", "Tapanuli Selatan", "Nias", "Langkat",
      "Karo", "Deli Serdang", "Simalungun", "Asahan", "Labuhanbatu",
      "Dairi", "Toba", "Mandailing Natal", "Nias Selatan", "Pakpak Bharat",
      "Humbang Hasundutan", "Samosir", "Serdang Bedagai", "Batu Bara",
      "Padang Lawas Utara", "Padang Lawas", "Labuhanbatu Selatan",
      "Labuhanbatu Utara", "Nias Utara", "Nias Barat",
    ],
    kota: [
      "Sibolga", "Tanjungbalai", "Pematangsiantar", "Tebing Tinggi", "Medan",
      "Binjai", "Padangsidimpuan", "Gunungsitoli",
    ],
  },
  "Sumatera Barat": {
    kab: [
      "Pesisir Selatan", "Solok", "Sijunjung", "Tanah Datar", "Padang Pariaman",
      "Agam", "Lima Puluh Kota", "Pasaman", "Kepulauan Mentawai", "Dharmasraya",
      "Solok Selatan", "Pasaman Barat",
    ],
    kota: ["Padang", "Solok", "Sawahlunto", "Padang Panjang", "Bukittinggi", "Payakumbuh", "Pariaman"],
  },
  Riau: {
    kab: [
      "Kampar", "Indragiri Hulu", "Indragiri Hilir", "Bengkalis", "Kuantan Singingi",
      "Pelalawan", "Rokan Hulu", "Rokan Hilir", "Siak", "Kepulauan Meranti",
    ],
    kota: ["Pekanbaru", "Dumai"],
  },
  "Kepulauan Riau": {
    kab: ["Karimun", "Bintan", "Natuna", "Lingga", "Kepulauan Anambas"],
    kota: ["Batam", "Tanjungpinang"],
  },
  Jambi: {
    kab: [
      "Kerinci", "Merangin", "Sarolangun", "Batanghari", "Muaro Jambi",
      "Tanjung Jabung Timur", "Tanjung Jabung Barat", "Tebo", "Bungo",
    ],
    kota: ["Jambi", "Sungai Penuh"],
  },
  Bengkulu: {
    kab: [
      "Bengkulu Selatan", "Rejang Lebong", "Bengkulu Utara", "Kaur", "Seluma",
      "Mukomuko", "Lebong", "Kepahiang", "Bengkulu Tengah",
    ],
    kota: ["Bengkulu"],
  },
  "Sumatera Selatan": {
    kab: [
      "Ogan Komering Ulu", "Ogan Komering Ilir", "Muara Enim", "Lahat", "Musi Rawas",
      "Musi Banyuasin", "Banyuasin", "Ogan Komering Ulu Selatan", "Ogan Komering Ulu Timur",
      "Ogan Ilir", "Empat Lawang", "Penukal Abab Lematang Ilir", "Musi Rawas Utara",
    ],
    kota: ["Palembang", "Pagar Alam", "Lubuklinggau", "Prabumulih"],
  },
  "Kepulauan Bangka Belitung": {
    kab: ["Bangka", "Belitung", "Bangka Barat", "Bangka Tengah", "Bangka Selatan", "Belitung Timur"],
    kota: ["Pangkalpinang"],
  },
  Lampung: {
    kab: [
      "Lampung Selatan", "Lampung Tengah", "Lampung Utara", "Lampung Barat", "Tulang Bawang",
      "Tanggamus", "Lampung Timur", "Way Kanan", "Pesawaran", "Pringsewu",
      "Mesuji", "Tulang Bawang Barat", "Pesisir Barat",
    ],
    kota: ["Bandar Lampung", "Metro"],
  },
  "DKI Jakarta": {
    kab: ["Kepulauan Seribu"],
    kota: ["Jakarta Selatan", "Jakarta Timur", "Jakarta Pusat", "Jakarta Barat", "Jakarta Utara"],
  },
  "Jawa Barat": {
    kab: [
      "Bogor", "Sukabumi", "Cianjur", "Bandung", "Garut", "Tasikmalaya", "Ciamis",
      "Kuningan", "Cirebon", "Majalengka", "Sumedang", "Indramayu", "Subang",
      "Purwakarta", "Karawang", "Bekasi", "Bandung Barat", "Pangandaran",
    ],
    kota: ["Bogor", "Sukabumi", "Bandung", "Cirebon", "Bekasi", "Depok", "Cimahi", "Tasikmalaya", "Banjar"],
  },
  "Jawa Tengah": {
    kab: [
      "Cilacap", "Banyumas", "Purbalingga", "Banjarnegara", "Kebumen", "Purworejo",
      "Wonosobo", "Magelang", "Boyolali", "Klaten", "Sukoharjo", "Wonogiri",
      "Karanganyar", "Sragen", "Grobogan", "Blora", "Rembang", "Pati", "Kudus",
      "Jepara", "Demak", "Semarang", "Temanggung", "Kendal", "Batang",
      "Pekalongan", "Pemalang", "Tegal", "Brebes",
    ],
    kota: ["Magelang", "Surakarta", "Salatiga", "Semarang", "Pekalongan", "Tegal"],
  },
  "DI Yogyakarta": {
    kab: ["Kulon Progo", "Bantul", "Gunungkidul", "Sleman"],
    kota: ["Yogyakarta"],
  },
  "Jawa Timur": {
    kab: [
      "Pacitan", "Ponorogo", "Trenggalek", "Tulungagung", "Blitar", "Kediri",
      "Malang", "Lumajang", "Jember", "Banyuwangi", "Bondowoso", "Situbondo",
      "Probolinggo", "Pasuruan", "Sidoarjo", "Mojokerto", "Jombang", "Nganjuk",
      "Madiun", "Magetan", "Ngawi", "Bojonegoro", "Tuban", "Lamongan", "Gresik",
      "Bangkalan", "Sampang", "Pamekasan", "Sumenep",
    ],
    kota: ["Kediri", "Blitar", "Malang", "Probolinggo", "Pasuruan", "Mojokerto", "Madiun", "Surabaya", "Batu"],
  },
  Banten: {
    kab: ["Pandeglang", "Lebak", "Tangerang", "Serang"],
    kota: ["Tangerang", "Cilegon", "Serang", "Tangerang Selatan"],
  },
  Bali: {
    kab: ["Jembrana", "Tabanan", "Badung", "Gianyar", "Klungkung", "Bangli", "Karangasem", "Buleleng"],
    kota: ["Denpasar"],
  },
  "Nusa Tenggara Barat": {
    kab: [
      "Lombok Barat", "Lombok Tengah", "Lombok Timur", "Sumbawa", "Dompu",
      "Bima", "Sumbawa Barat", "Lombok Utara",
    ],
    kota: ["Mataram", "Bima"],
  },
  "Nusa Tenggara Timur": {
    kab: [
      "Kupang", "Timor Tengah Selatan", "Timor Tengah Utara", "Belu", "Alor",
      "Flores Timur", "Sikka", "Ende", "Ngada", "Manggarai", "Sumba Timur",
      "Sumba Barat", "Lembata", "Rote Ndao", "Manggarai Barat", "Nagekeo",
      "Sumba Tengah", "Sumba Barat Daya", "Manggarai Timur", "Sabu Raijua", "Malaka",
    ],
    kota: ["Kupang"],
  },
  "Kalimantan Barat": {
    kab: [
      "Sambas", "Bengkayang", "Landak", "Mempawah", "Sanggau", "Ketapang",
      "Sintang", "Kapuas Hulu", "Sekadau", "Melawi", "Kayong Utara", "Kubu Raya",
    ],
    kota: ["Pontianak", "Singkawang"],
  },
  "Kalimantan Tengah": {
    kab: [
      "Kotawaringin Barat", "Kotawaringin Timur", "Kapuas", "Barito Selatan",
      "Barito Utara", "Sukamara", "Lamandau", "Seruyan", "Katingan",
      "Pulang Pisau", "Gunung Mas", "Barito Timur", "Murung Raya",
    ],
    kota: ["Palangka Raya"],
  },
  "Kalimantan Selatan": {
    kab: [
      "Tanah Laut", "Kotabaru", "Banjar", "Barito Kuala", "Tapin",
      "Hulu Sungai Selatan", "Hulu Sungai Tengah", "Hulu Sungai Utara",
      "Tabalong", "Tanah Bumbu", "Balangan",
    ],
    kota: ["Banjarmasin", "Banjarbaru"],
  },
  "Kalimantan Timur": {
    kab: ["Paser", "Kutai Barat", "Kutai Kartanegara", "Kutai Timur", "Berau", "Penajam Paser Utara", "Mahakam Ulu"],
    kota: ["Balikpapan", "Samarinda", "Bontang"],
  },
  "Kalimantan Utara": {
    kab: ["Malinau", "Bulungan", "Tana Tidung", "Nunukan"],
    kota: ["Tarakan"],
  },
  "Sulawesi Utara": {
    kab: [
      "Bolaang Mongondow", "Minahasa", "Kepulauan Sangihe", "Kepulauan Talaud",
      "Minahasa Selatan", "Minahasa Utara", "Bolaang Mongondow Utara",
      "Kepulauan Siau Tagulandang Biaro", "Minahasa Tenggara",
      "Bolaang Mongondow Selatan", "Bolaang Mongondow Timur",
    ],
    kota: ["Manado", "Bitung", "Tomohon", "Kotamobagu"],
  },
  Gorontalo: {
    kab: ["Boalemo", "Gorontalo", "Pohuwato", "Bone Bolango", "Gorontalo Utara"],
    kota: ["Gorontalo"],
  },
  "Sulawesi Tengah": {
    kab: [
      "Banggai", "Banggai Kepulauan", "Morowali", "Poso", "Donggala", "Toli-Toli",
      "Buol", "Parigi Moutong", "Tojo Una-Una", "Sigi", "Banggai Laut", "Morowali Utara",
    ],
    kota: ["Palu"],
  },
  "Sulawesi Barat": {
    kab: ["Majene", "Polewali Mandar", "Mamasa", "Mamuju", "Mamuju Utara", "Mamuju Tengah"],
    kota: [],
  },
  "Sulawesi Selatan": {
    kab: [
      "Kepulauan Selayar", "Bulukumba", "Bantaeng", "Jeneponto", "Takalar",
      "Gowa", "Sinjai", "Maros", "Pangkajene dan Kepulauan", "Barru", "Bone",
      "Soppeng", "Wajo", "Sidenreng Rappang", "Pinrang", "Enrekang", "Luwu",
      "Tana Toraja", "Luwu Utara", "Luwu Timur", "Toraja Utara",
    ],
    kota: ["Makassar", "Pare-Pare", "Palopo"],
  },
  "Sulawesi Tenggara": {
    kab: [
      "Kolaka", "Konawe", "Muna", "Buton", "Konawe Selatan", "Bombana", "Wakatobi",
      "Kolaka Utara", "Buton Utara", "Konawe Utara", "Kolaka Timur",
      "Konawe Kepulauan", "Muna Barat", "Buton Tengah", "Buton Selatan",
    ],
    kota: ["Kendari", "Baubau"],
  },
  Maluku: {
    kab: [
      "Maluku Tenggara", "Maluku Tengah", "Buru", "Kepulauan Aru", "Seram Bagian Barat",
      "Seram Bagian Timur", "Maluku Barat Daya", "Buru Selatan", "Maluku Tenggara Barat",
    ],
    kota: ["Ambon", "Tual"],
  },
  "Maluku Utara": {
    kab: [
      "Halmahera Barat", "Halmahera Tengah", "Kepulauan Sula", "Halmahera Selatan",
      "Halmahera Utara", "Halmahera Timur", "Pulau Morotai", "Pulau Taliabu",
    ],
    kota: ["Ternate", "Tidore Kepulauan"],
  },
  Papua: {
    kab: ["Jayapura", "Biak Numfor", "Kepulauan Yapen", "Sarmi", "Keerom", "Waropen", "Mamberamo Raya", "Supiori"],
    kota: ["Jayapura"],
  },
  "Papua Barat": {
    kab: ["Manokwari", "Manokwari Selatan", "Pegunungan Arfak", "Fakfak", "Kaimana", "Teluk Wondama", "Teluk Bintuni"],
    kota: [],
  },
  "Papua Barat Daya": {
    kab: ["Sorong", "Sorong Selatan", "Raja Ampat", "Tambrauw", "Maybrat"],
    kota: ["Sorong"],
  },
  "Papua Tengah": {
    kab: ["Nabire", "Puncak Jaya", "Paniai", "Mimika", "Puncak", "Dogiyai", "Intan Jaya", "Deiyai"],
    kota: [],
  },
  "Papua Pegunungan": {
    kab: ["Jayawijaya", "Pegunungan Bintang", "Yahukimo", "Tolikara", "Yalimo", "Mamberamo Tengah", "Nduga", "Lanny Jaya"],
    kota: [],
  },
  "Papua Selatan": {
    kab: ["Merauke", "Boven Digoel", "Mappi", "Asmat"],
    kota: [],
  },
};

// Opsi khusus untuk WK lepas pantai di luar batas wilayah administratif
// (>12 mil laut dari garis pantai) -- tidak terikat provinsi tertentu.
export const KABUPATEN_NON_ADMINISTRATIF = "Di Atas 12 Mil Laut";
