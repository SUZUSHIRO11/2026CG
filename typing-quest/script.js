
// ==============================
// ゲームの基本設定
// ==============================

let playerHP = 100;
let playerMaxHP = 100;

let playerMP = 0;
let enemyHP = 60;
let enemyMaxHP = 60;

let score = 0;
let combo = 0;
let kill = 0;
let stage = 1;

let timeLeft = 10;
let timer = null;

let currentWord = null;
let startTime = 0;

let isPlaying = false;
let isBusy = false;
let skillArmed = false;

const TIME_LIMIT = 10;

const enemies = [
    { name: "スライム", label: "SLIME", icon: "🟢", hp: 60, attack: 10 },
    { name: "ゴブリン", label: "GOBLIN", icon: "👺", hp: 90, attack: 15 },
    { name: "ドラゴン", label: "DRAGON", icon: "🐉", hp: 130, attack: 20 }
];

let currentEnemy = null;


// ==============================
// HTML要素の取得
// ==============================

const $ = (id) => document.getElementById(id);

const playerHpBar = $("player-hp-bar");
const enemyHpBar = $("enemy-hp-bar");
const mpBar = $("mp-bar");
const skillBar = $("skill-bar");

const input = $("typing-input");


// ==============================
// 画面表示の更新
// ==============================

function updateStatus() {

    $("player-hp").textContent = playerHP;
    $("player-mp").textContent = playerMP;
    $("enemy-hp").textContent = enemyHP;

    playerHpBar.style.width =
        (playerHP / playerMaxHP * 100) + "%";

    enemyHpBar.style.width =
        (enemyHP / enemyMaxHP * 100) + "%";

    mpBar.style.width = playerMP + "%";
    skillBar.style.width = playerMP + "%";

    $("combo").textContent = combo;
    $("score").textContent = score;
    $("kill").textContent = kill;
    $("stage").textContent = "STAGE " + stage;

    const skillButton = $("skill-button");

    skillButton.disabled =
        !isPlaying || playerMP < 100 || isBusy || skillArmed;

    skillButton.classList.toggle(
        "active",
        playerMP >= 100 && !skillArmed
    );

    skillButton.textContent = skillArmed
        ? "必殺技 発動待ち！"
        : "必殺技を発動！";
}


// ==============================
// 敵の設定
// ==============================

function setEnemy() {

    currentEnemy = enemies[
        Math.min(stage - 1, enemies.length - 1)
    ];

    enemyMaxHP = currentEnemy.hp;
    enemyHP = enemyMaxHP;

    $("enemy-name").textContent = currentEnemy.name;
    $("enemy-label").textContent = currentEnemy.label;
    $("enemy-icon").textContent = currentEnemy.icon;

    $("battle-message").textContent =
        currentEnemy.name + " が現れた！";

    updateStatus();
}


// ==============================
// タイピング問題の出題
// ==============================

function nextWord() {

    currentWord = words[
        Math.floor(Math.random() * words.length)
    ];

    $("word-kana").textContent = currentWord.kana;

    $("word-romaji").textContent =
        currentWord.romaji[0];

    input.value = "";
    input.disabled = false;

    $("typing-feedback").textContent =
        "正確に入力して攻撃しよう！";

    input.focus();

    startTimer();
}


// ==============================
// 制限時間
// ==============================

function startTimer() {

    clearInterval(timer);

    timeLeft = TIME_LIMIT;

    $("timer").textContent = timeLeft + "秒";

    startTime = Date.now();

    timer = setInterval(() => {

        if (!isPlaying || isBusy) return;

        timeLeft--;

        $("timer").textContent = timeLeft + "秒";

        if (timeLeft <= 0) {
            clearInterval(timer);
            missAttack("時間切れ！");
        }

    }, 1000);
}


// ==============================
// ゲーム開始
// ==============================

function startGame() {

    clearInterval(timer);

    playerHP = playerMaxHP;
    playerMP = 0;

    score = 0;
    combo = 0;
    kill = 0;
    stage = 1;

    skillArmed = false;

    isPlaying = true;
    isBusy = false;

    $("result-screen").classList.add("hidden");

    $("start-button").disabled = true;
    $("submit-button").disabled = false;

    setEnemy();

    $("battle-message").textContent =
        "勇者よ、戦いを始めよう！";

    $("effect-message").textContent = "";

    updateStatus();

    nextWord();
}


// ==============================
// タイピング判定
// ==============================

function submitTyping() {

    if (!isPlaying || isBusy) return;

    const answer = input.value
        .trim()
        .toLowerCase();

    // 正解判定
    const isCorrect = currentWord.romaji.includes(answer);

    if (!isCorrect) {

        missAttack("入力が違う！");

        return;
    }

    clearInterval(timer);

    const elapsed = (Date.now() - startTime) / 1000;

    // 入力時間による評価
    let damageMultiplier = 1;
    let result = "GOOD";

    if (elapsed <= 2.5) {

        damageMultiplier = 2;
        result = "PERFECT!";

    } else if (elapsed <= 5) {

        damageMultiplier = 1.5;
        result = "GREAT!";

    }

    // コンボ増加
    combo++;

    // コンボボーナス
    if (combo >= 10) {
        damageMultiplier *= 1.5;
    } else if (combo >= 5) {
        damageMultiplier *= 1.25;
    }

    // 基本攻撃力
    let damage = Math.floor(
        20 * damageMultiplier
    );

    // 必殺技
    if (skillArmed) {

        damage = Math.floor(damage * 2.5);

        skillArmed = false;
        playerMP = 0;

        $("effect-message").textContent =
            "★ SPECIAL ATTACK!! ★";

    } else {

        playerMP = Math.min(playerMP + 20, 100);

        $("effect-message").textContent =
            result + "  " + damage + " DAMAGE!";
    }

    // 敵のHPを減らす
    enemyHP = Math.max(0, enemyHP - damage);

    // スコア加算
    score += damage;

    $("typing-feedback").textContent =
        result + "！ 攻撃成功！";

    $("battle-message").textContent =
        "勇者の攻撃！ " + damage + " ダメージ！";

    $("effect-message").style.color =
        result === "PERFECT!" ? "#ffe66d" : "#8cf7b0";

    updateStatus();

    // 敵を倒した場合
    if (enemyHP <= 0) {

        enemyDefeated();

    } else {

        // 敵の反撃
        enemyTurn();

    }
}


// ==============================
// 入力失敗
// ==============================

function missAttack(message) {

    if (!isPlaying || isBusy) return;

    clearInterval(timer);

    combo = 0;
    skillArmed = false;

    $("effect-message").textContent =
        "MISS!";

    $("effect-message").style.color = "#ff5757";

    $("typing-feedback").textContent = message;

    $("battle-message").textContent =
        "攻撃に失敗した！";

    updateStatus();

    enemyTurn();
}


// ==============================
// 敵のターン
// ==============================

function enemyTurn() {

    if (!isPlaying || isBusy) return;

    isBusy = true;

    input.disabled = true;
    $("submit-button").disabled = true;

    updateStatus();

    clearInterval(timer);

    setTimeout(() => {

        if (!isPlaying) return;

        const damage = currentEnemy.attack;

        playerHP = Math.max(0, playerHP - damage);

        $("battle-message").textContent =
            currentEnemy.name + " の反撃！";

        $("effect-message").textContent =
            "HP -" + damage;

        $("effect-message").style.color =
            "#ff5757";

        updateStatus();

        if (playerHP <= 0) {

            gameOver();

        } else {

            setTimeout(() => {

                if (!isPlaying) return;

                isBusy = false;

                $("battle-message").textContent =
                    "次の攻撃を入力せよ！";

                $("effect-message").textContent = "";

                updateStatus();

                nextWord();

                $("submit-button").disabled = false;

            }, 600);

        }

    }, 700);
}


// ==============================
// 敵を倒したとき
// ==============================

function enemyDefeated() {

    isBusy = true;

    kill++;

    combo += 1;

    score += 100;

    clearInterval(timer);

    input.disabled = true;
    $("submit-button").disabled = true;

    $("battle-message").textContent =
        currentEnemy.name + " を倒した！";

    $("effect-message").textContent =
        "VICTORY! +100 POINT";

    updateStatus();

    if (kill >= 3) {

        setTimeout(() => {
            gameClear();
        }, 1000);

        return;
    }

    setTimeout(() => {

        if (!isPlaying) return;

        stage++;

        isBusy = false;

        setEnemy();

        $("effect-message").textContent =
            "NEXT STAGE!";

        updateStatus();

        nextWord();

        $("submit-button").disabled = false;

    }, 1200);
}


// ==============================
// 必殺技の発動
// ==============================

function useSkill() {

    if (
        !isPlaying ||
        isBusy ||
        playerMP < 100 ||
        skillArmed
    ) {
        return;
    }

    skillArmed = true;

    $("battle-message").textContent =
        "必殺技の準備完了！";

    $("effect-message").textContent =
        "次の攻撃が2.5倍になる！";

    $("typing-feedback").textContent =
        "正確に入力して必殺技を決めろ！";

    updateStatus();

    input.focus();
}


// ==============================
// ゲームクリア
// ==============================

function gameClear() {

    endGame(
        "VICTORY!",
        "全てのモンスターを倒した！\n"
        + "最終スコア：" + score + "\n"
        + "撃破数：" + kill
    );
}


// ==============================
// ゲームオーバー
// ==============================

function gameOver() {

    endGame(
        "GAME OVER",
        "勇者は力尽きた...\n"
        + "スコア：" + score + "\n"
        + "撃破数：" + kill
    );
}


// ==============================
// 結果画面
// ==============================

function endGame(title, message) {

    clearInterval(timer);

    isPlaying = false;
    isBusy = false;
    skillArmed = false;

    input.disabled = true;

    $("submit-button").disabled = true;
    $("start-button").disabled = false;

    $("result-title").textContent = title;
    $("result-text").textContent = message;

    $("result-screen").classList.remove("hidden");

    updateStatus();
}


// ==============================
// イベント設定
// ==============================

$("start-button").addEventListener(
    "click",
    startGame
);

$("submit-button").addEventListener(
    "click",
    submitTyping
);

$("skill-button").addEventListener(
    "click",
    useSkill
);

$("retry-button").addEventListener(
    "click",
    startGame
);

input.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {

        event.preventDefault();

        submitTyping();

    }

});

// 初期表示
updateStatus();
