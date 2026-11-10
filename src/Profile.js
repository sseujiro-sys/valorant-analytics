
(() => {
  const client = window.valorantSupabase;
  if (!client) {
    console.error("Supabase bağlantısı bulunamadı.");
    return;
  }

  // PROFİL TASARIMI
  const style = document.createElement("style");

  style.textContent = `
    .profile-panel {
      position:fixed;
      inset:0;
      z-index:10000;
      display:none;
      align-items:center;
      justify-content:center;
      background:rgba(0,0,0,.85);
      padding:20px;
    }

    .profile-panel.open {
      display:flex;
    }

    .profile-card {
      width:100%;
      max-width:420px;
      padding:28px;
      background:#151922;
      color:white;
      border-radius:14px;
      border:1px solid #343b49;
    }

    .profile-card h2 {
      margin-top:0;
    }

    .profile-card label {
      display:block;
      margin:14px 0 6px;
    }

    .profile-card input {
      width:100%;
      box-sizing:border-box;
      padding:12px;
      border-radius:7px;
      border:1px solid #394252;
      background:#0d1119;
      color:white;
    }

    .profile-card button {
      padding:12px;
      border:0;
      border-radius:7px;
      cursor:pointer;
      font-weight:bold;
    }

    .profile-save {
      width:100%;
      margin-top:20px;
      background:#ff4655;
      color:white;
    }

    .profile-save:disabled {
      opacity:.6;
      cursor:wait;
    }

    .profile-close {
      float:right;
      background:transparent;
      color:white;
    }

    .profile-message {
      color:#f2c66d;
      margin-top:12px;
    }

    .avatar-preview {
      width:100px;
      height:100px;
      border-radius:50%;
      object-fit:cover;
      display:block;
      margin:12px auto;
      border:3px solid #ff4655;
      background:#252c38;
    }

    .profile-card input[type=file] {
      padding:9px;
    }

    #profileBtn .avatar.small {
      width:40px;
      height:40px;
      min-width:40px;
      max-width:40px;
      max-height:40px;
      flex-shrink:0;
      overflow:hidden;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      border:2px solid #ff4655;
      border-radius:50%;
    }

    #profileBtn .avatar.small img {
      width:100%;
      height:100%;
      display:block;
      object-fit:cover;
      object-position:center;
      border-radius:50%;
    }
  `;

  document.head.appendChild(style);

  // PROFİL PENCERESİ
  const panel = document.createElement("div");
  panel.className = "profile-panel";

  panel.innerHTML = `
    <div class="profile-card">
      <button class="profile-close" type="button">✕</button>

      <div class="eyebrow red">OYUNCU PROFİLİ</div>
      <h2>Profilini düzenle</h2>

      <img
        id="avatarPreview"
        class="avatar-preview"
        alt="Profil fotoğrafı"
      >

      <form id="profileForm">

        <label for="avatarFile">Profil fotoğrafı seç</label>
        <input
          id="avatarFile"
          type="file"
          accept="image/png,image/jpeg,image/webp"
        >

        <label for="profileDisplayName">Oyuncu adı</label>
        <input
          id="profileDisplayName"
          maxlength="40"
          required
        >

        <label for="profileRiotId">Riot ID (ör. Arhana#TR1)</label>
        <input
          id="profileRiotId"
          maxlength="30"
          placeholder="Arhana#TR1"
        >

        <button class="profile-save" type="submit">
          PROFİLİ KAYDET
        </button>

      </form>

      <div class="profile-message" id="profileMessage"></div>
    </div>
  `;

  document.body.appendChild(panel);

  const $id = id => document.getElementById(id);
  const msg = text => {
    $id("profileMessage").textContent = text;
  };

  let currentAvatar = null;
  let previewObjectUrl = null;

  // SAĞ ÜST AVATARINI GÜNCELLE
  function setTopAvatar(url) {
    const avatar = document.querySelector(
      "#profileBtn .avatar.small"
    );

    if (!avatar) return;

    avatar.replaceChildren();

    if (url) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "Profil fotoğrafı";

      img.onerror = () => {
        avatar.textContent = "KA";
      };

      avatar.appendChild(img);
    } else {
      avatar.textContent = "KA";
    }
  }

  // KULLANICI ADINI GÜNCELLE
  function setDisplayName(name) {
    ["topName", "sideName"].forEach(id => {
      const element = document.getElementById(id);

      if (element && name) {
        element.textContent = name;
      }
    });
  }

  // PROFİL BİLGİLERİNİ VERİTABANINDAN AL
  async function loadProfile(user) {
    if (!user) {
      currentAvatar = null;
      setTopAvatar(null);
      return;
    }

    const { data, error } = await client
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Profil yükleme hatası:", error.message);
      return;
    }

    if (data) {
      currentAvatar = data.avatar_url || null;

      setTopAvatar(currentAvatar);

      if (data.display_name) {
        setDisplayName(data.display_name);
      }
    } else {
      setTopAvatar(null);
    }
  }

  // PROFİL PENCERESİNİ AÇ
  async function openProfile() {
    const { data, error } = await client.auth.getUser();

    const user = data?.user;

    if (error || !user) {
      alert("Profilini düzenlemek için önce giriş yapmalısın.");
      return;
    }

    msg("Profil bilgileri yükleniyor...");

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      msg("Profil yüklenemedi: " + profileError.message);
      return;
    }

    $id("profileDisplayName").value =
      profile?.display_name ||
      user.user_metadata?.display_name ||
      "";

    $id("profileRiotId").value =
      profile?.username || "";

    currentAvatar = profile?.avatar_url || null;

    setTopAvatar(currentAvatar);

    $id("avatarPreview").src = currentAvatar || "";
    $id("avatarFile").value = "";

    msg("");
    panel.classList.add("open");
  }

  // FOTOĞRAF SEÇİMİ
  $id("avatarFile").addEventListener("change", event => {
    const file = event.target.files[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      msg("Lütfen JPG, PNG veya WEBP dosyası seç.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      msg("Fotoğraf en fazla 2 MB olabilir.");
      event.target.value = "";
      return;
    }

    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }

    previewObjectUrl = URL.createObjectURL(file);

    $id("avatarPreview").src = previewObjectUrl;

    msg("Fotoğraf seçildi. Kaydettiğinde yüklenecek.");
  });

  // PENCEREYİ KAPAT
  panel.querySelector(".profile-close")
    .addEventListener("click", () => {
      panel.classList.remove("open");
    });

  panel.addEventListener("click", event => {
    if (event.target === panel) {
      panel.classList.remove("open");
    }
  });

  // PROFİLİ KAYDET
  $id("profileForm").addEventListener("submit", async event => {
    event.preventDefault();

    const { data: authData, error: authError } =
      await client.auth.getUser();

    const user = authData?.user;

    if (authError || !user) {
      msg("Oturum bulunamadı. Tekrar giriş yap.");
      return;
    }

    const button = panel.querySelector(".profile-save");

    button.disabled = true;
    msg("Profil kaydediliyor...");

    try {
      const displayName =
        $id("profileDisplayName").value.trim();

      const riotId =
        $id("profileRiotId").value.trim();

      const file = $id("avatarFile").files[0];

      if (!displayName) {
        throw new Error("Oyuncu adı boş bırakılamaz.");
      }

      if (
        riotId &&
        !/^[^#]{1,16}#[^#]{1,5}$/.test(riotId)
      ) {
        throw new Error(
          "Riot ID formatı hatalı. Örnek: Arhana#TR1"
        );
      }

      // FOTOĞRAFI SUPABASE STORAGE'A YÜKLE
      if (file) {
        const extension = file.name
          .split(".")
          .pop()
          .toLowerCase();

        const path = `${user.id}/avatar.${extension}`;

        const { error: uploadError } = await client.storage
          .from("avatars")
          .upload(path, file, {
            upsert: true,
            contentType: file.type
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicData } = client.storage
          .from("avatars")
          .getPublicUrl(path);

        currentAvatar =
          publicData.publicUrl + "?v=" + Date.now();
      }

      // PROFİL BİLGİLERİNİ VERİTABANINA KAYDET
      const { error: saveError } = await client
        .from("profiles")
        .upsert({
          id: user.id,
          display_name: displayName,
          username: riotId || null,
          avatar_url: currentAvatar,
          updated_at: new Date().toISOString()
        });

      if (saveError) {
        throw saveError;
      }

      setDisplayName(displayName);
      setTopAvatar(currentAvatar);

      msg("Profil ve fotoğraf başarıyla kaydedildi!");

      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
      }

    } catch (error) {
      msg("Hata: " + error.message);

    } finally {
      button.disabled = false;
    }
  });

  // OTURUM AÇILINCA PROFİLİ YÜKLE
  client.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      setTimeout(() => loadProfile(session.user), 0);
    } else {
      currentAvatar = null;
      setTopAvatar(null);
    }
  });

  // SAYFA AÇILDIĞINDA MEVCUT PROFİLİ YÜKLE
  client.auth.getUser().then(({ data, error }) => {
    if (!error && data?.user) {
      loadProfile(data.user);
    }
  });

  // ÇIKIŞ YAP BUTONU
const logoutButton = document.createElement("button");

logoutButton.textContent = "ÇIKIŞ YAP";
logoutButton.type = "button";

logoutButton.style.cssText = `
  width:100%;
  margin-top:12px;
  padding:12px;
  border:1px solid #ff4655;
  border-radius:8px;
  background:transparent;
  color:#ff4655;
  font-weight:bold;
  cursor:pointer;
`;

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  logoutButton.textContent = "Çıkış yapılıyor...";

  const { error } = await client.auth.signOut();

  if (error) {
    alert("Çıkış yapılamadı: " + error.message);
    logoutButton.disabled = false;
    logoutButton.textContent = "ÇIKIŞ YAP";
    return;
  }

  panel.classList.remove("open");
  location.reload();
});

// BUTONU PROFİL PENCERESİNE EKLE
panel.querySelector(".profile-card").appendChild(logoutButton);

// APP.JS TARAFINDAN ÇAĞRILAN FONKSİYON
window.openValorantProfile = openProfile;
  window.openValorantProfile = openProfile;

})();
