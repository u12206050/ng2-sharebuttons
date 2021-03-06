import {Injectable} from '@angular/core';
import {Http, Jsonp} from "@angular/http";
import {Observable} from "rxjs";

import {ShareProvider} from "../helpers/share-provider.enum";
import {ShareButtonsInterface} from "./share-buttons.interface";
import {ShareArgs} from "../helpers/share-buttons.class";

@Injectable()
export class ShareButtonsService implements ShareButtonsInterface {

    /** Optional parameters for to set default inputs */
    windowWidth: number = 500;
    windowHeight: number = 400;

    /** Site Twitter Account: Add Via @TwitterAccount to the tweet  */
    twitterAccount: string;

    constructor(private http: Http, private jsonp: Jsonp) {
    }

    share(type, args) {
        switch (type) {
            case ShareProvider.FACEBOOK:
                return this.fbShare(args);
            case ShareProvider.TWITTER:
                return this.twitterShare(args);
            case ShareProvider.LINKEDIN:
                return this.linkedInShare(args);
            case ShareProvider.REDDIT:
                return this.redditShare(args);
            case ShareProvider.TUMBLR:
                return this.tumblrShare(args);
            case ShareProvider.STUMBLEUPON:
                return this.stumbleShare(args);
            case ShareProvider.GOOGLEPLUS:
                return this.gPlusShare(args);
            case ShareProvider.PINTEREST:
                return this.pinShare(args);
            default:
                return '';
        }
    }

    private fbShare(args: ShareArgs) {
        let shareUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + args.url;
        if (args.title) {
            shareUrl += "&title=" + args.title;
        }
        if (args.description) {
            shareUrl += "&description=" + args.description;
        }
        if (args.image) {
            shareUrl += "&picture=" + args.image;
        }
        return shareUrl;
    }

    //TWITTER DOCS: https://dev.twitter.com/web/tweet-button/web-intent
    private twitterShare(args: ShareArgs) {
        let shareUrl = 'https://twitter.com/intent/tweet?url=' + args.url;
        if (args.description) {
            shareUrl += '&text=' + args.description;
        }
        if (this.twitterAccount) {
            shareUrl += '&via=' + this.twitterAccount;
        }
        if (args.tags) {
            shareUrl += '&hashtags=' + args.tags.toString();
        }
        return shareUrl;
    }

    //LINKEDIN DOCS https://developer.linkedin.com/docs/share-on-linkedin#!
    private linkedInShare(args: ShareArgs) {
        let shareUrl = 'http://www.linkedin.com/shareArticle?url=' + args.url;
        if (args.title) {
            shareUrl += "&title=" + args.title;
        }
        if (args.description) {
            shareUrl += "&summary=" + args.description;
        }
        return shareUrl;
    }

    //REDDIT DOCS: http://stackoverflow.com/questions/24823114/post-to-reddit-via-url
    private redditShare(args: ShareArgs) {
        let shareUrl = 'http://www.reddit.com/submit?url=' + args.url;
        if (args.title) {
            shareUrl += "&title=" + args.title;
        }
        return shareUrl
    }

    //TUMBLR DOCS: https://www.tumblr.com/docs/en/share_button
    private tumblrShare(args: ShareArgs) {
        let shareUrl = 'http://tumblr.com/widgets/share/tool?canonicalUrl=' + args.url;
        if (args.description) {
            shareUrl += "&caption=" + args.description;
        }
        if (args.tags) {
            shareUrl += "&tags=" + args.tags;
        }
        return shareUrl;
    }

    //STUMBLE DOCS: http://stackoverflow.com/questions/10591424/how-can-i-create-a-custom-stumbleupon-button
    private stumbleShare(args: ShareArgs) {
        return 'http://www.stumbleupon.com/submit?url=' + args.url;
    }

    //GPLUS DOCS: https://developers.google.com/+/web/share/#sharelink
    private gPlusShare(args: ShareArgs) {
        return 'https://plus.google.com/share?url=' + args.url;
    }

    private pinShare(args: ShareArgs) {
        let shareUrl = 'https://in.pinterest.com/pin/create/button/?url=' + args.url;
        //if text is not provided, pin button won't work.
        if (args.description) {
            shareUrl += '&description=' + args.description;
        }
        else {
            let desc = document.querySelector('meta[property="og:description"]').getAttribute('content');
            shareUrl += '&description=' + desc;
        }
        if (args.image) {
            shareUrl += '&media=' + args.image;
        }
        else {
            let image = document.querySelector('meta[property="og:image"]').getAttribute('content');
            shareUrl += '&media=' + image;
        }
        return shareUrl;
    }


    /** Share Counts */

    count(type, url) {
        switch (type) {
            case ShareProvider.FACEBOOK:
                return this.fbCount(url);
            case ShareProvider.LINKEDIN:
                return this.linkedInCount(url);
            case ShareProvider.REDDIT:
                return this.redditCount(url);
            case ShareProvider.TUMBLR:
                return this.tumblrCount(url);
            case ShareProvider.GOOGLEPLUS:
                return this.gPlusCount(url);
            case ShareProvider.PINTEREST:
                return this.pinCount(url);
            default:
                return Observable.empty();
        }
    }

    private fbCount(url: string) {
        return this.fetch('https://graph.facebook.com/?id=' + url)
            .map((data: any) => {
                data = data.json();
                if (data.hasOwnProperty('share') && data.share.hasOwnProperty('share_count')) {
                    return data.share.share_count;
                }
                return 0;
            });
    }

    private linkedInCount(url: string) {
        return this.fetchJsonp('https://www.linkedin.com/countserv/count/share?url=' + url)
            .map((data: any) => {
                data = data.json();
                return data.count | 0;
            });
    }

    private redditCount(url: string) {
        return this.fetch('https://buttons.reddit.com/button_info.json?url=' + url)
            .map((data: any)=> {
                data = data.json();
                if (data.hasOwnProperty('data') && data.data.hasOwnProperty('children')) {
                    if (data.data.children.length) return data.data.children[0].data.score;
                }
                return 0;
            });
    }

    private gPlusCount(url: string) {
        let body = gplusCountBody(url);
        return this.http.post('https://clients6.google.com/rpc?key=AIzaSyCKSbrvQasunBoV16zDH9R33D88CeLr9gQ', body)
            .map((data: any)=> {
                data = data.json();
                if (data[0] && data[0].hasOwnProperty('result')) {
                    return data[0].result.metadata.globalCounts.count;
                }
                return 0;
            });
    }

    private pinCount(url: string) {
        return this.fetch('https://api.pinterest.com/v1/urls/count.json?callback=receiveCount&url=' + url)
            .map((data: any)=> {
                data = data.text();
                var result = JSON.parse(data.replace(/^receiveCount\((.*)\)/, '$1'));
                return result.count | 0;
            });
    }

    private tumblrCount(url: string) {
        return this.fetchJsonp('https://api.tumblr.com/v2/share/stats?url=' + url)
            .map((data: any) => {
                data = data.json();
                if (data.hasOwnProperty('response') && data.response.hasOwnProperty('note_count')) {
                    return data.response.note_count;
                }
                return 0;
            });
    }

    private fetch(url) {
        return this.http.get(url)
            .catch((err)=> {
                console.warn('[ShareService HTTP]: ', err);
                return Observable.empty();
            });
    }

    private fetchJsonp(url) {
        return this.jsonp.request(url + '&format=jsonp&callback=JSONP_CALLBACK')
            .catch((err)=> {
                console.warn('[ShareService JSONP]: ', err);
                return Observable.empty();
            });
    }

    windowAttr() {
        return 'width=' + this.windowWidth + ', height=' + this.windowHeight;
    }
}


/** Prepare GPlus Count Post request body   */
export const gplusCountBody = (url) => {
    return [{
        "method": "pos.plusones.get",
        "id": "p",
        "params": {"nolog": true, "id": url, "source": "widget", "userId": "@viewer", "groupId": "@self"},
        "jsonrpc": "2.0",
        "key": "p",
        "apiVersion": "v1"
    }];
};