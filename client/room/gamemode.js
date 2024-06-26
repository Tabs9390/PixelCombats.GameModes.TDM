import { DisplayValueHeader } from 'pixel_combats/basic';
import { Game, Players, Inventory, LeaderBoard, BuildBlocksSet, Teams, Damage, BreackGraph, Ui, Properties, GameMode, Spawns, Timers, TeamsBalancer, NewGame, NewGameVote } from 'pixel_combats/room';
import * as teams from './default_teams.js';

// настройки
const WaitingPlayersTime = 2;
const BuildBaseTime = 1;
const KnivesModeTime = 1;
const GameModeTime = 1;
const EndOfMatchTime = 3;
const VoteTime = 1;
const maxDeaths = "ФЕРМА";

// имена используемых объектов
const WaitingStateValue = "Waiting";
const BuildModeStateValue = "ТюТюТб";
const KnivesModeStateValue = "KnivesMode";
const GameStateValue = "Game";
const EndOfMatchStateValue = "EndOfMatch";
const immortalityTimerName = "immortality"; // имя таймера, используемого в контексте игрока, для его бессмертия

// получаем объекты, с которыми работает режим
const mainTimer = Timers.GetContext().Get("Main");
const stateProp = Properties.GetContext().Get("State");

// применяем параметры конструктора режима
Damage.GetContext().FriendlyFire.Value = GameMode.Parameters.GetBool("FriendlyFire");
const MapRotation = GameMode.Parameters.GetBool("MapRotation");
BreackGraph.WeakBlocks = GameMode.Parameters.GetBool("LoosenBlocks");
BreackGraph.OnlyPlayerBlocksDmg = GameMode.Parameters.GetBool("OnlyPlayerBlocksDmg");

// бустим блоки игрока
BreackGraph.PlayerBlockBoost = true;

// ��������� ����
Properties.GetContext().GameModeName.Value = "GameModes/Team Dead Match";
TeamsBalancer.IsAutoBalance = true;
Ui.GetContext().MainTimerId.Value = mainTimer.Id;
// создаем стандартные команды
const redTeam = teams.create_team_red();
redTeam.Build.BlocksSet.Value = BuildBlocksSet.Red;

// задаем запас смертей в каждой команде
redTeam.Properties.Get("Deaths").Value = maxDeaths;
// настраиваем параметры, которые нужно выводить в лидерборде
LeaderBoard.PlayerLeaderBoardValues = [
	new DisplayValueHeader("Kills", "Statistics/Kills", "Statistics/KillsShort"),
	new DisplayValueHeader("Deaths", "Statistics/Deaths", "Statistics/DeathsShort"),
	new DisplayValueHeader("Spawns", "Statistics/Spawns", "Statistics/SpawnsShort"),
	new DisplayValueHeader("Scores", "Statistics/Scores", "Statistics/ScoresShort")
];
LeaderBoard.TeamLeaderBoardValue = new DisplayValueHeader("Deaths", "Statistics\Deaths", "Statistics\Deaths");
// ��� ������� � ����������
LeaderBoard.TeamWeightGetter.Set(function (team) {
	return team.Properties.Get("Deaths").Value;
});
// ��� ������ � ����������
LeaderBoard.PlayersWeightGetter.Set(function (player) {
	return player.Properties.Get("Kills").Value;
});

// ������ ��� �������� ������
Ui.GetContext().TeamProp2.Value = { Team: "Red", Prop: "Deaths" };

// ��������� ���� � ������� �� �������
Teams.OnRequestJoinTeam.Add(function (player, team) { team.Add(player); });
// ����� �� ����� � �������

Teams.OnPlayerChangeTeam.Add(function (player) { player.Spawns.Spawn() });
Spawns.GetContext().OnSpawn.Add(function (player) {
	player.Properties.Immortality.Value = true;
	player.Timers.Get(immortalityTimerName).Restart(1);
});
Timers.OnPlayerTimer.Add(function (timer) {
	if (timer.Id != immortalityTimerName) return;
	timer.Player.Properties.Immortality.Value = false;
});

// ����� ������ ������ ������ �������� ���� ������ � �������
Properties.OnPlayerProperty.Add(function (context, value) {
	if (value.Name !== "Deaths") return;
	if (context.Player.Team == null) return;
	context.Player.Team.Properties.Get("Deaths").Value--;
});
// ���� � ������� ���������� ������� ���������� �� ��������� ����
Properties.OnTeamProperty.Add(function (context, value) {
	if (value.Name !== "Deaths") return;
	if (value.Value <= 0) SetEndOfMatchMode();
});

// ������� �������
Spawns.OnSpawn.Add(function (player) {
	++player.Properties.Spawns.Value;
});
// ������� �������
Damage.OnDeath.Add(function (player) {
	++player.Properties.Deaths.Value;
});
// ������� �������
Damage.OnKill.Add(function (player, killed) {
	if (killed.Team != null && killed.Team != player.Team) {
		++player.Properties.Kills.Value;
		player.Properties.Scores.Value += 100;
	}
});

// таймер переключения состояний
mainTimer.OnTimer.Add(function () {
	switch (stateProp.Value) {
		case WaitingStateValue:
			SetBuildMode();
			break;
		case BuildModeStateValue:
			SetKnivesMode();
			break;
		case KnivesModeStateValue:
			SetGameMode();
			break;
		case EndOfMatchStateValue:
			NewGame.RestartGame();
			break;
	}
});

// изначально задаем состояние ожидания других игроков
SetWaitingMode();

// состояния игры
function SetWaitingMode() {
	stateProp.Value = WaitingStateValue;
	Ui.GetContext().Hint.Value = "https://t.me/pixelcombatsfun";
	Spawns.GetContext().enable = false;
	mainTimer.Restart(WaitingPlayersTime);
}
function SetBuildMode() {
	stateProp.Value = BuildModeStateValue;
	Ui.GetContext().Hint.Value = "https://t.me/pixelcombatsfun";
	var inventory = Inventory.GetContext();
	inventory.Main.Value = false;
	inventory.Secondary.Value = false;
	inventory.Melee.Value = true;
	inventory.Explosive.Value = false;
	inventory.Build.Value = true;
	// запрет нанесения урона
	Damage.GetContext().DamageOut.Value = false;

	mainTimer.Restart(BuildBaseTime);
	Spawns.GetContext().enable = true;
}
function SetKnivesMode() {
	stateProp.Value = KnivesModeStateValue;
	Ui.GetContext().Hint.Value = "https://t.me/pixelcombatsfun";
	var inventory = Inventory.GetContext();
	inventory.Main.Value = false;
	inventory.Secondary.Value = false;
	inventory.Melee.Value = true;
	inventory.Explosive.Value = false;
	inventory.Build.Value = true;
	// разрешение нанесения урона
	Damage.GetContext().DamageOut.Value = true;

	mainTimer.Restart(KnivesModeTime);
	Spawns.GetContext().enable = true;
}
function SetGameMode() {
	// разрешаем нанесение урона
	Damage.GetContext().DamageOut.Value = true;
	stateProp.Value = GameStateValue;
	Ui.GetContext().Hint.Value = "https://t.me/pixelcombatsfun";

	var inventory = Inventory.GetContext();
	if (GameMode.Parameters.GetBool("OnlyKnives")) {
		inventory.Main.Value = false;
		inventory.Secondary.Value = false;
		inventory.Melee.Value = true;
		inventory.Explosive.Value = false;
		inventory.Build.Value = true;
	} else {
		inventory.Main.Value = true;
		inventory.Secondary.Value = true;
		inventory.Melee.Value = true;
		inventory.Explosive.Value = true;
		inventory.Build.Value = true;
	}

	mainTimer.Restart(GameModeTime);
	Spawns.GetContext().Despawn();
	SetEndOfMatchMode();
}


function SetEndOfMatchMode() {
	stateProp.Value = EndOfMatchStateValue;
	Ui.GetContext().Hint.Value = "https://t.me/pixelcombatsfun";

	var spawns = Spawns.GetContext();
	spawns.enable = false;
	spawns.Despawn();
	Game.GameOver(LeaderBoard.GetTeams());
	mainTimer.Restart(EndOfMatchTime);
}

function OnVoteResult(v) {
	if (v.Result === null) return;
	NewGame.RestartGame(v.Result);
}
NewGameVote.OnResult.Add(OnVoteResult); // вынесено из функции, которая выполняется только на сервере, чтобы не зависало, если не отработает, также чтобы не давало баг, если вызван метод 2 раза и появилось 2 подписки

function start_vote() {
	NewGameVote.Start({
		Variants: [{ MapId: 0 }],
		Timer: VoteTime
	}, MapRotation ? 3 : 0);
		}
