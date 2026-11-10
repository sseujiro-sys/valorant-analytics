
(() => {
  const client = window.valorantSupabase;

  if (!client) {
    console.error("Supabase bağlantısı bulunamadı.");
    return;
  }

  const comparePage = document.getElementById("compare");
  if (!comparePage) return;

  const style = document.createElement("style");

  style.textContent = `
    .player-search {
      background:#151922;
      border:1px solid #343b49;
      border-radius:12px;
      padding:20px;
      margin-bottom:24px;
    }

    .player-search h3 { margin:0 0 8px; }

    .player-search p {
      color:#929bad;
      font-size:13px;
    }

    .player-search-controls {
      display:flex;
      gap:10px;
      margin-top:16px;
    }

    .player-search-controls input {
      flex:1;
      min-width:0;
      padding:13px;
      border-radius:7px;
      border:1px solid #394252;
      background:#0d1119;
      color:white;
    }

    .player-search-controls button,
    .friend-action {
      padding:12px 20px;
      border:0;
      border-radius:7px;
      background:#ff4655;
      color:white;
      font-weight:bold;
      cursor:pointer;
    }

    .player-search-controls button:disabled,
    .friend-action:disabled {
      opacity:.6;
      cursor:wait;
    }

    .player-results {
      display:grid;
      gap:10px;
      margin-top:18px;
    }

    .player-result {
      display:flex;
      align-items:center;
      gap:13px;
      padding:12px;
      border-radius:9px;
      background:#0d1119;
      border:1px solid #293140;
    }

    .player-result img,
    .player-result .player-placeholder {
      width:44px;
      height:44px;
      min-width:44px;
      border-radius:50%;
      object-fit:cover;
      background:#303847;
    }

    .player-placeholder {
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-weight:bold;
    }

    .player-result-info {
      flex:1;
      min-width:0;
    }

    .player-result-info strong {
      display:block;
      color:white;
    }

    .player-result-info small {
      color:#929bad;
    }

    .player-search-message {
      color:#f2c66d;
      font-size:13px;
      margin-top:12px;
    }

    .friend-action {
      padding:10px 14px;
      white-space:nowrap;
      font-size:12px;
    }

    .friend-action.done {
      background:#263344;
      color:#9eacbd;
      cursor:default;
    }

    @media(max-width:600px) {
      .player-result {
        flex-wrap:wrap;
      }

      .friend-action {
        width:100%;
      }
    }
  `;

  document.head.appendChild(style);

  const searchBox = document.createElement("div");
  searchBox.className = "player-search";

  searchBox.innerHTML = `
    <div class="eyebrow red">TOPLULUK</div>
    <h3>Oyuncu ara</h3>
    <p>Oyuncu adı veya Riot ID kullanarak kayıtlı kullanıcıları bul.</p>

    <div class="player-search-controls">
      <input
        id="playerSearchInput"
        type="text"
        maxlength="50"
        placeholder="Örn. Crispus veya Arhana#TR1"
      >
      <button id="playerSearchButton" type="button">ARA</button>
    </div>

    <div class="player-search-message" id="playerSearchMessage"></div>
    <div class="player-results" id="playerResults"></div>
  `;

  const compareControls = comparePage.querySelector(".compare-controls");

  if (compareControls) {
    comparePage.insertBefore(searchBox, compareControls);
  } else {
    comparePage.prepend(searchBox);
  }

  const input = document.getElementById("playerSearchInput");
  const button = document.getElementById("playerSearchButton");
  const results = document.getElementById("playerResults");
  const message = document.getElementById("playerSearchMessage");

  // ARKADAŞLIK DURUMUNU KONTROL ET
  async function getFriendshipStatus(myId, playerId) {
    const { data, error } = await client
      .from("friendships")
      .select("requester_id, addressee_id, status")
      .or(
        `and(requester_id.eq.${myId},addressee_id.eq.${playerId}),and(requester_id.eq.${playerId},addressee_id.eq.${myId})`
      );

    if (error) throw error;

    if (!data || data.length === 0) {
      return "none";
    }

    const friendship = data[0];

    if (friendship.status === "accepted") {
      return "accepted";
    }

    if (friendship.requester_id === myId) {
      return "sent";
    }

    return "received";
  }

  // ARKADAŞLIK BUTONU
  async function sendFriendRequest(player, buttonElement, statusText) {
    buttonElement.disabled = true;
    buttonElement.textContent = "Gönderiliyor...";

    try {
      const { data: authData, error: authError } =
        await client.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("Önce giriş yapmalısın.");
      }

      const myId = authData.user.id;

      const status = await getFriendshipStatus(myId, player.id);

      if (status !== "none") {
        updateFriendButton(buttonElement, status);
        return;
      }

      const { error } = await client
        .from("friendships")
        .insert({
          requester_id: myId,
          addressee_id: player.id,
          status: "pending"
        });

      if (error) throw error;

      updateFriendButton(buttonElement, "sent");
      statusText.textContent = "Arkadaşlık isteği gönderildi.";

    } catch (error) {
      buttonElement.textContent = "Tekrar Dene";
      buttonElement.disabled = false;
      message.textContent = "İşlem hatası: " + error.message;
    }
  }

  // BUTON GÖRÜNÜMÜ
  function updateFriendButton(buttonElement, status) {
    buttonElement.classList.remove("done");

    if (status === "accepted") {
      buttonElement.textContent = "Arkadaşsınız";
      buttonElement.disabled = true;
      buttonElement.classList.add("done");
    } else if (status === "sent") {
      buttonElement.textContent = "İstek Gönderildi";
      buttonElement.disabled = true;
      buttonElement.classList.add("done");
    } else if (status === "received") {
      buttonElement.textContent = "Sana istek gönderdi";
      buttonElement.disabled = true;
      buttonElement.classList.add("done");
    } else {
      buttonElement.textContent = "Arkadaş Ekle";
      buttonElement.disabled = false;
    }
  }

  // SONUÇLARI GÖSTER
  async function renderPlayers(players, myId) {
    results.replaceChildren();

    if (!players.length) {
      message.textContent = "Aramanla eşleşen oyuncu bulunamadı.";
      return;
    }

    message.textContent = `${players.length} oyuncu bulundu.`;

    for (const player of players) {
      const card = document.createElement("div");
      card.className = "player-result";

      if (player.avatar_url) {
        const img = document.createElement("img");
        img.src = player.avatar_url;
        img.alt = "Oyuncu avatarı";

        img.onerror = () => {
          const placeholder = document.createElement("div");
          placeholder.className = "player-placeholder";
          placeholder.textContent =
            (player.display_name || "?").charAt(0).toUpperCase();
          img.replaceWith(placeholder);
        };

        card.appendChild(img);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "player-placeholder";
        placeholder.textContent =
          (player.display_name || "?").charAt(0).toUpperCase();

        card.appendChild(placeholder);
      }

      const info = document.createElement("div");
      info.className = "player-result-info";

      const name = document.createElement("strong");
      name.textContent = player.display_name || "İsimsiz oyuncu";

      const riot = document.createElement("small");
      riot.textContent = player.username || "Riot ID eklenmemiş";

      info.append(name, riot);

      const friendButton = document.createElement("button");
      friendButton.type = "button";
      friendButton.className = "friend-action";
      friendButton.textContent = "Kontrol ediliyor...";
      friendButton.disabled = true;

      const statusText = document.createElement("small");
      statusText.style.display = "block";
      statusText.style.color = "#929bad";
      statusText.style.marginTop = "5px";

      info.appendChild(statusText);

      friendButton.addEventListener("click", () => {
        sendFriendRequest(player, friendButton, statusText);
      });

      card.append(info, friendButton);
      results.appendChild(card);

      try {
        const status = await getFriendshipStatus(myId, player.id);
        updateFriendButton(friendButton, status);
      } catch (error) {
        friendButton.textContent = "Durum alınamadı";
        friendButton.disabled = true;
        statusText.textContent = error.message;
      }
    }
  }

  // OYUNCU ARA
  async function searchPlayers() {
    const term = input.value.trim();

    results.replaceChildren();

    if (term.length < 2) {
      message.textContent = "En az 2 karakter yazmalısın.";
      return;
    }

    button.disabled = true;
    message.textContent = "Oyuncular aranıyor...";

    try {
      const { data: authData, error: authError } =
        await client.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("Arama yapmak için giriş yapmalısın.");
      }

      const myId = authData.user.id;

      const [nameSearch, riotSearch] = await Promise.all([
        client
          .from("profiles")
          .select("id, display_name, username, avatar_url")
          .ilike("display_name", `%${term}%`)
          .eq("is_public", true)
          .neq("id", myId)
          .limit(10),

        client
          .from("profiles")
          .select("id, display_name, username, avatar_url")
          .ilike("username", `%${term}%`)
          .eq("is_public", true)
          .neq("id", myId)
          .limit(10)
      ]);

      if (nameSearch.error) throw nameSearch.error;
      if (riotSearch.error) throw riotSearch.error;

      const combined = [
        ...(nameSearch.data || []),
        ...(riotSearch.data || [])
      ];

      const uniquePlayers = [
        ...new Map(combined.map(player => [player.id, player])).values()
      ].slice(0, 10);

      await renderPlayers(uniquePlayers, myId);

    } catch (error) {
      message.textContent = "Arama hatası: " + error.message;
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener("click", searchPlayers);

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      searchPlayers();
    }
  });

  // GELEN ARKADAŞLIK İSTEKLERİ
  const inbox = document.createElement("div");
  inbox.className = "player-search";
  inbox.innerHTML = `
    <div class="eyebrow red">TOPLULUK</div>
    <h3>Gelen Arkadaşlık İstekleri</h3>
    <div id="friendRequestList" class="player-results">
      <p>İstekler yükleniyor...</p>
    </div>
  `;

  if (compareControls) {
    comparePage.insertBefore(inbox, compareControls);
  } else {
    comparePage.appendChild(inbox);
  }

  async function loadFriendRequests() {
    const list = inbox.querySelector("#friendRequestList");
    list.replaceChildren();

    try {
      const { data: authData, error: authError } =
        await client.auth.getUser();

      if (authError || !authData.user) {
        list.textContent = "İstekleri görmek için giriş yapmalısın.";
        return;
      }

      const myId = authData.user.id;

      const { data: requests, error } = await client
        .from("friendships")
        .select("requester_id")
        .eq("addressee_id", myId)
        .eq("status", "pending");

      if (error) throw error;

      if (!requests || requests.length === 0) {
        list.textContent = "Bekleyen arkadaşlık isteğin yok.";
        return;
      }

      const requesterIds = requests.map(r => r.requester_id);

      const { data: profiles, error: profileError } = await client
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", requesterIds);

      if (profileError) throw profileError;

      for (const profile of profiles || []) {
        const card = document.createElement("div");
        card.className = "player-result";

        if (profile.avatar_url) {
          const img = document.createElement("img");
          img.src = profile.avatar_url;
          img.alt = "Oyuncu avatarı";
          card.appendChild(img);
        } else {
          const avatar = document.createElement("div");
          avatar.className = "player-placeholder";
          avatar.textContent =
            (profile.display_name || "?").charAt(0).toUpperCase();
          card.appendChild(avatar);
        }

        const info = document.createElement("div");
        info.className = "player-result-info";

        const name = document.createElement("strong");
        name.textContent = profile.display_name || "İsimsiz oyuncu";

        const riot = document.createElement("small");
        riot.textContent = profile.username || "Riot ID eklenmemiş";

        info.append(name, riot);

        const actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.gap = "8px";

        const accept = document.createElement("button");
        accept.className = "friend-action";
        accept.textContent = "Kabul Et";

        const decline = document.createElement("button");
        decline.className = "friend-action";
        decline.textContent = "Reddet";
        decline.style.background = "#303847";

        accept.addEventListener("click", () => {
          updateFriendRequest(profile.id, "accepted", accept, decline);
        });

        decline.addEventListener("click", () => {
          updateFriendRequest(profile.id, "declined", accept, decline);
        });

        actions.append(accept, decline);
        card.append(info, actions);
        list.appendChild(card);
      }

    } catch (error) {
      list.textContent = "İstekler yüklenemedi: " + error.message;
    }
  }

  async function updateFriendRequest(requesterId, newStatus, accept, decline) {
    accept.disabled = true;
    decline.disabled = true;

    try {
      const { data: authData, error: authError } =
        await client.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("Oturum bulunamadı.");
      }

      const { error } = await client
        .from("friendships")
        .update({ status: newStatus })
        .eq("requester_id", requesterId)
        .eq("addressee_id", authData.user.id)
        .eq("status", "pending");

      if (error) throw error;

      await loadFriendRequests();

    } catch (error) {
      alert("İşlem başarısız: " + error.message);
      accept.disabled = false;
      decline.disabled = false;
    }
  }

  loadFriendRequests();

  client.auth.onAuthStateChange(() => {
    setTimeout(loadFriendRequests, 300);
  });

  // ARKADAŞLARIM VE ÇEVRİMİÇİ DURUM
  const friendsBox = document.createElement("div");
  friendsBox.className = "player-search";

  friendsBox.innerHTML = `
    <div class="eyebrow red">TOPLULUK</div>
    <h3>Arkadaşlarım</h3>
    <div id="friendsList" class="player-results">
      <p>Arkadaşlar yükleniyor...</p>
    </div>
  `;

  if (compareControls) {
    comparePage.insertBefore(friendsBox, compareControls);
  } else {
    comparePage.appendChild(friendsBox);
  }

  // KENDİ ÇEVRİMİÇİ DURUMUNU GÜNCELLE
  async function updateMyPresence() {
    const { data } = await client.auth.getUser();
    const user = data?.user;

    if (!user) return;

    const { error } = await client
      .from("user_presence")
      .upsert({
        user_id: user.id,
        last_seen: new Date().toISOString()
      });

    if (error) {
      console.error("Durum güncellenemedi:", error.message);
    }
  }

  // ARKADAŞ LİSTESİNİ YÜKLE
  async function loadFriends() {
    const list = friendsBox.querySelector("#friendsList");
    list.replaceChildren();

    try {
      const { data: authData, error: authError } =
        await client.auth.getUser();

      if (authError || !authData.user) {
        list.textContent = "Arkadaşlarını görmek için giriş yapmalısın.";
        return;
      }

      const myId = authData.user.id;

      const { data: friendships, error } = await client
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`);

      if (error) throw error;

      if (!friendships || friendships.length === 0) {
        list.textContent = "Henüz arkadaşın bulunmuyor.";
        return;
      }

      const friendIds = friendships.map(friend =>
        friend.requester_id === myId
          ? friend.addressee_id
          : friend.requester_id
      );

      const { data: profiles, error: profileError } = await client
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", friendIds);

      if (profileError) throw profileError;

      const { data: presence, error: presenceError } = await client
        .from("user_presence")
        .select("user_id, last_seen")
        .in("user_id", friendIds);

      if (presenceError) throw presenceError;

      const now = Date.now();

      for (const friend of profiles || []) {
        const status = presence?.find(
          item => item.user_id === friend.id
        );

        const isOnline = status &&
          (now - new Date(status.last_seen).getTime()) < 90000;

        const card = document.createElement("div");
        card.className = "player-result";

        if (friend.avatar_url) {
          const img = document.createElement("img");
          img.src = friend.avatar_url;
          img.alt = "Arkadaş avatarı";
          card.appendChild(img);
        } else {
          const avatar = document.createElement("div");
          avatar.className = "player-placeholder";
          avatar.textContent =
            (friend.display_name || "?").charAt(0).toUpperCase();
          card.appendChild(avatar);
        }

        const info = document.createElement("div");
        info.className = "player-result-info";

        const name = document.createElement("strong");
        name.textContent = friend.display_name || "İsimsiz oyuncu";

        const riot = document.createElement("small");
        riot.textContent = friend.username || "Riot ID eklenmemiş";

        const statusLine = document.createElement("small");
        statusLine.style.display = "block";
        statusLine.style.marginTop = "5px";
        statusLine.style.color = isOnline ? "#22c55e" : "#929bad";
        statusLine.textContent = isOnline ? "● Çevrimiçi" : "● Çevrimdışı";

        info.append(name, riot, statusLine);
        card.appendChild(info);
        list.appendChild(card);
      }

    } catch (error) {
      list.textContent = "Arkadaşlar yüklenemedi: " + error.message;
    }
  }

  // SAYFA AÇILINCA VE HER 30 SANİYEDE DURUMU GÜNCELLE
  updateMyPresence();
  loadFriends();

  setInterval(updateMyPresence, 30000);
  setInterval(loadFriends, 30000);

  // OTURUM DEĞİŞİNCE LİSTEYİ YENİLE
  client.auth.onAuthStateChange(() => {
    setTimeout(() => {
      updateMyPresence();
      loadFriends();
    }, 500);
  });

  console.log("Oyuncu arama ve arkadaşlık sistemi hazır.");
})();
