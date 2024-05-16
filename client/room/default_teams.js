// предполагается как общая библиотека, для создания и работы со стандартными командами в режимах (синие, красные, зомби)
// предложения и пул реквесты по улучшению библиотеки приветствуются
import { Color } from 'pixel_combats/basic';
import { Teams } from 'pixel_combats/room';

export const RED_TEAM_NAME = "ФАРМ";
export const RED_TEAM_DISPLAY_NAME = "https://t.me/pixelcombatsfun";
export const RED_TEAM_SPAWN_POINTS_GROUP = 2;
export const RED_TEAM_COLOR = new Color(0, 0, 0, 0);

export function create_team_red() {
    Teams.Add(RED_TEAM_NAME, RED_TEAM_DISPLAY_NAME, RED_TEAM_COLOR);
    const team = Teams.Get(RED_TEAM_NAME);
    return team;
}
