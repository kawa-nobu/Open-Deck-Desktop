const { app, net } = require('electron')
/* Open-Deck のアップデート関連 */
async function get_update() {
    try {
        //GitHub のリリースから最新のリリースを取得
        const res = await net.fetch(
            `https://api.github.com/repos/kawa-nobu/Open-Deck-Desktop/releases/latest`,
            {
                headers: {
                    Accept: 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                }
            }
        );
        if (!res.ok) {
            console.error('Failed to fetch release:', res.status, res.statusText);
            return;
        }

        const release = await res.json();
        const current_version = `v${app.getVersion()}`;
        const latest_version = release.tag_name || '';

        if(current_version !== latest_version){
            //最新のリリースがあった場合
            return {
                is_update: true,
                latest_version: latest_version,
            }
        }

        //アップデートがない場合
        return {
            is_update: false,
            latest_version: null,
        }

    } catch (err) {
        console.error('Update check error:', err);
    }

}

module.exports = {
  get_update
}