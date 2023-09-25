document.addEventListener('alpine:init', () => {
    Alpine.data('initData', () => ({
        config: null,
        configTitle: '',
        configDescription: '',
        configKeywords: '',
        configIntro: '',
        answers: JSON.parse(localStorage.getItem('answers') || '[]'),
        stats: JSON.parse(localStorage.getItem('stats') || '[]'),
        played: 0,
        currentStreak: 0,
        maxStreak: 0,
        day: 1,
        lastGame: 0,
        percentage: 0,
        found: 0,
        solutionCount: 0,
        gameStarted: false,
        todaysString: '',
        todaysLetters: [],
        validWords: [],
        yesterdayValidWords: [],
        yesterdaysString: '',
        letterOne: '',
        letterTwo: '',
        letterThree: '',
        letterFour: '',
        guess: '',
        definitions: [],
        lastPlayed: new Date().toISOString().split('T')[0],
        today: new Date().toISOString().split('T')[0],
        showStats: false,
        showToast: false,
        clipboardCopy: false,
        timer: '',
        showHelp: false,
        showPreviousAnswers: false,
        toastText: '',
        date: new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
        checkLetter(e) {
            var letter = e.key.toLowerCase();
            this.checkKey(letter);
        },
        checkKey(letter) {
            this.toastText = '';
            this.gameStarted = true;

            if(letter == 'backspace') {
                this.toastText = '';
                this.deleteLetter();
            }

            if(letter == 'enter') {

                if(this.letterFour.length == 0) {
                    this.updateToast('Please enter 4 letters');
                    return;
                }

            } else {

                if (!this.todaysLetters.includes(letter)) {
                    return;
                }
    
                if(this.letterOne.length == 0) {
                    this.letterOne = letter;
                    return;
                }
                if(this.letterTwo.length == 0) {
                    this.letterTwo = letter;
                    return;
                }
                if(this.letterThree.length == 0) {
                    this.letterThree = letter;
                    return;
                }
                if(this.letterFour.length == 0) {
                    this.letterFour = letter;
                    return;
                }
                if(this.letterFour.length > 0) {
                    return;
                }

            }

            this.guess = this.letterOne + this.letterTwo + this.letterThree + this.letterFour;

            if (this.answers.includes(this.guess)) {
                this.updateToast('You have already found that word');
                return;
            }

            if (this.validWords.includes(this.guess)) {
                this.answers.push(this.guess);
                this.answers.sort();
                localStorage.setItem('answers', JSON.stringify(this.answers))

                if(this.answers.length == this.validWords.length) {
                    localStorage.setItem('gameOver', true)
                    this.gameOver = true;
                    this.showStats = true;

                }

                this.letterOne = '';
                this.letterTwo = '';
                this.letterThree = '';
                this.letterFour = '';
                this.guess = '';

            } else {
                this.updateToast('Not a valid word');
            }

            this.updateStats()
            this.parseStats()
        },
        buttonDisabled(key) {
            if (!this.todaysLetters.includes(key)) {
                return true;
            }
            return false;
        },
        deleteLetter() {
            if(this.letterFour.length > 0) {
                this.letterFour = '';
                return;
            }
            if(this.letterThree.length > 0) {
                this.letterThree = '';
                return;
            }
            if(this.letterTwo.length > 0) {
                this.letterTwo = '';
                return;
            }
            if(this.letterOne.length > 0) {
                this.letterOne = '';
                return;
            }
        },
        updateToast(text) {
            this.showToast = true;
            this.toastText = text;
            var count = 1;
            var t = window.setInterval(() => {
                count++;
                if (count == 5 && this.gameStarted) {
                    this.toastText = '';
                    clearInterval(t);
                }
            }, 1000);
        },
        updateStats() {
            if(this.lastGame != this.day) {
                this.lastGame = this.day;
                localStorage.setItem('gameOver', false)
                this.gameOver = false;
                this.showStats = false;
                this.stats.played = this.stats.played + 1;
                this.currentStreak = this.currentStreak + 1;
                if(this.currentStreak > this.maxStreak) {
                    this.maxStreak = this.currentStreak;
                }
            }

            this.stats.currentStreak = this.currentStreak;
            this.stats.maxStreak = this.maxStreak;
            this.stats.lastPlayed = new Date().toISOString().split('T')[0];

            localStorage.setItem('stats', JSON.stringify(this.stats))
        },
        init() {
            var day = daysIntoYear();
            this.parseStats()
            this.countdownTimer();
            this.todaysString = getString(day);
            this.todaysLetters = Array.from(this.todaysString);
            this.validWords = getValidWords(this.todaysString).sort();
            this.solutionCount = this.validWords.length;
            this.yesterdaysString = getString(day - 1);
            this.yesterdayValidWords = getValidWords(this.yesterdaysString).sort();
            this.updateToast('Start typing to play...');
        },
        parseStats() {
            if(Object.keys(this.stats).length) {
                this.lastPlayed = this.stats.lastPlayed;
                this.lastGame = Number(this.stats.lastGame) ?? this.day;
                this.played = this.stats.played;
                this.currentStreak = this.stats.currentStreak;
                this.maxStreak = this.stats.maxStreak;
            } else {
                this.stats = {
                    'lastPlayed': this.lastPlayed,
                    'lastGame': this.lastGame,
                    'played': this.played,
                    'currentStreak': this.currentStreak,
                    'maxStreak': this.maxStreak
                }
            }
        },
        async parseConfig() {
            let response = await fetch('config.json')
            this.config = await response.json()
            this.configTitle = this.config.title;
            this.configDescription = this.config.description;
            this.configKeywords = this.config.keywords;
            this.configIntro = this.config.intro;
            this.day = daysIntoYear();
            if(this.lastGame != this.day) {
                this.lastGame = this.day;
                localStorage.setItem('gameOver', false)
                this.gameOver = false;
                this.showStats = false;
                this.answers = [];
                localStorage.setItem('answers', JSON.stringify(this.answers))
                this.stats.lastGame = this.day;
                this.stats.played = this.stats.played + 1;
                this.currentStreak = this.currentStreak + 1;
                if(this.currentStreak > this.maxStreak) {
                    this.maxStreak = this.currentStreak;
                }
            }
            this.updateStats()
            let response_definitions = await fetch('definitions.json')
            this.definitions = await response_definitions.json()
        },
        share() {
            this.clipboardCopy = true;
            this.gameStarted = true;
            let share = this.config.title + ' #' + this.day + ' ' + "\n\n";

            share += "Found " + this.answers.length + " out of " + this.validWords.length + "\n\n";

            var percent = ((100 * this.answers.length) / this.validWords.length).toFixed(1);
            var chart = ['⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜'];
            var nearest = Math.floor(percent / 10) * 10;

            if(nearest > 0) {
                nearest = Number(nearest.toString().slice(0, -1));
            }

            for (let step = 0; step < nearest; step++) {
                chart[step] = '🟩';
            }

            share += chart.join('') + ' ' + percent + "%\n\n" + document.URL;

            var count = 1;
            var c = window.setInterval(() => {
                count++;
                if (count == 4 && this.gameStarted) {
                    this.clipboardCopy = false;
                    clearInterval(c);
                }
            }, 1000);

            navigator.clipboard.writeText(share).then(
                () => {
                  
                },
                () => {
                    
                },
            );
        },
        countdownTimer() {
            const today = new Date()
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)
            tomorrow.setHours(0,0,0,0);
            const countDownDate = tomorrow.getTime();
            // Update the count down every 1 second
            var x = window.setInterval(() => {
                var now = new Date().getTime();
                var distance = countDownDate - now;
                var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                var seconds = Math.floor((distance % (1000 * 60)) / 1000);
                var hourPad = '';
                var minutePad = '';
                var secondPad = '';
                if(hours < 10) {
                    hourPad = "0";
                }
                if(minutes < 10) {
                    minutePad = "0";
                }
                if(seconds < 10) {
                    secondPad = "0";
                }
                this.timer = hourPad + "" + hours + ":" + minutePad + "" + minutes + ":" + secondPad + "" + seconds;
                if (distance < 0) {
                    clearInterval(x);
                    location.reload();
                }
            }, 1000);
        }
    }))
})
document.addEventListener('alpine:init', () => {
    Alpine.store('dark', {
        on: localStorage.getItem('dark') === 'true',
        init() {
            if (localStorage.getItem('dark') === 'true' || (!('dark' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark')
            } else {
                document.documentElement.classList.remove('dark')
            }
        },
        disable() {
            this.on = false
            localStorage.setItem('dark', false)
            document.documentElement.classList.remove('dark');
        },
        enable() {
            this.on = true
            localStorage.setItem('dark', true)
            document.documentElement.classList.add('dark');
        }
    })
})


function daysIntoYear(){
    var date = new Date();
    return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
}

function getString(key) {
    var json = JSON.parse('["uokdptnmx","ecndfhtbm","gbdhpaerw","gwlaydmeo","eszvrfndk","tcxpahwed","kehpsxcwa","lhqegdvrs","ajrgpnwet","levnxibpg","ohkulmznd","nfaujplvb","kbamjucvl","sgorfablz","dskzpcorv","rpexlzcdf","abekfcmiw","ybvmptead","sbmeapvld","mnykiqlwe","yzsrxvcia","npdlbczye","hrlfouysw","xlkfadozr","nzohmxyed","tmfkulsvh","ntgiredfv","byemrgtck","dmkneurig","zklqhyeag","kusginowc","rxclnoyds","msealqybp","gwtablndm","hdolcgsza","askndixre","qburmlanz","kqmhuelfr","tlfomuzix","eioxnbqst","zjmdcsovt","zrmnaysic","ouqnjbcea","qvsucralk","jlvmakzex","pfjolmabu","sjiqlbtmp","lvitebmjs","pxudcasrj","norwacpeu","rwaeqlhbg","orsgwlzbh","citodmvke","ftlkdpwno","txhapfiej","wervyaxos","emszgohbc","bhwavemjr","jsofhvixt","wkoxydtah","pbemaghxy","htrwzjbes","ynxiajvum","lkdxprhao","mbwclhtas","rfuowcekm","crauntvyi","tryaxmfoh","bzsteljuw","fbqupthsy","tlhvouyaj","puesrbxcw","gpcliurtf","tocsmyfnz","gnraoishf","dyioetcnq","bjoyuefhn","zeplqhsmw","tacxhwdlg","uwrbzxsge","ftyulsiqv","npaqudfex","higrncpbo","sbmydlavt","ekvsizrlq","armiylftp","tgolndmxc","xpbsairgo","mrlncjkia","egufptdxs","xlhsvitbg","udgrxtyho","bifpvmskh","ylgifbmje","hcdioyrfl","fqtyhosgl","ovguidbrz","dpamueygj","cjifepsog","guzbovpet","jouzhkrpe","kelxdtbsi","zwepcqous","aqhosvcwy","xrmicndog","nwailzbrm","iwbunadco","bkoxgmfsn","jslgxdbok","yiqnmdkla","drmjnyxeo","tyuzaephk","pjiowbfgl","xiesqlnmu","virekwsyz","mlyrgbhec","excftlpdk","vawbkmspj","njbhgezos","chakzousw","tobdxpaij","awelozypd","bvyiphrea","egqtrkyhm","ajpurxemz","hkermwlau","ifuchygan","aplenzroy","teswxqcop","kjietaouw","hkwsxegqp","jwybsroat","mxoearjch","biwvkryse","mtofvkjir","rscqnuyet","okgasfnch","fiodumlqh","usmowqlrh","owtnbhdzg","yuzpcoesn","tyouxhfrk","rikfytdes","byzcaiuft","xemtcuylo","kailvnqzc","sczrtiobm","olvkbwecp","qtybaldrs","nwtequybo","aesrduiln","ukaqijmdo","grnxlimdy","kpwcejsfz","tpsrjxbhi","epcatliko","rlajqxsdp","hbaemvysz","rjycubomd","safeihgyd","aptigbkoe","egnsuxmyd","iemrjfcaz","doftphxmu","mqyosactl","zhcpytuia","sobenmkjq","zntfaxswm","gkalnctiy","jdkyliwap","xuoehstig","odjusxrkb","bfempzhoc","vpinkwumo","uhycbjpno","pniodsbmq","qdsktoyug","blhpqdjsa","beipcskqo","avxtigmke","oekgfdrwc","cxqlemoji","gyazbejuo","nfhewsucx","olixefpjt","asocgtywe","xwsuleiqc","kmuocbart","clwnovegk","lickqysrp","csylmprqa","dcrnwaegs","buikmfcet","ovlhuecgy","ekpzlicvt","eouwzxdcn","lembcshqf","waozlpgyb","shgwotiun","penhjcdza","krawipynl","ydobiewus","ysativloc","vermskwtn","ftqcobjln","leohrtbav","awtszmnob","sbefmpail","eiknqsvcr","suvzjdkie","apomlzhfb","tnuhklixq","pxgceskzi","otxnfswbr","swtyldazc","dyxozvmeh","nqbydexvi","eyltasrgb","glzeftimr","crnseqvgb","gqsldrhxe","sonrhdeuz","unmaitfyp","kztrxdhoc","osqtnfcpj","owaplxchd","ahjqexvds","tfemuzpwi","keojivgul","noruytqbk","rowskdipx","jmrhbflax","ljnsteiaq","pwohasktg","xovqsnbud","kdawnzjce","gptxhysre","snxjocufa","rwlaebuqn","niglhjzda","hifqgyosd","yxjbswlpa","mfwkzcnbo","wpgxhulsf","uklzensyc","cizjlwemt","evfcslhyk","yfgpriuot","fwerzdskb","jmacwiyul","orjpslnbf","xnsriupkf","ajiunvhld","szqrmwotf","gpvkqlios","shwyoxcnj","vmjsutdgk","iaupsghoj","lfuxzdcah","upblaseno","lcuskqzra","kqestpzoa","icdesxjqr","capishvyu","spqvwyact","nwbahmgey","nfrslpqad","forsvqinc","wrkhoesav","upsodrwcj","zjkhnoyat","yadqpgtow","kdasicpnr","svziljcka","objryknxu","vwmrajpyd","ejdvkfomu","nifsmzgrx","froqvegjs","lsxjawkpy","jaxbprsui","iykupzxle","rmpahuyqs","dpzlesatv","zcekqltfo","wkyrhadtl","qjdeamlup","valxidcot","lamotivdb","tbholwmdr","ijprexmgy","lghfkarjd","fvcmikosz","imwfnblux","dzgpmleuc","mjzqlpifa","eyzrostvf","qvlaebond","ifkrtoslu","qsxrombwk","sugfrmkve","uxiethdsv","tbjpwrhon","egwaqizds","weotxdlpb","exlacipsf","endkfuiml","hdinjegyp","zoabfugty","xuertlwon","cdtqwosrg","efboimxyu","vexnsztad","lpufjmqow","jsqoemplf","vcghknayt","jitwsahpn","utzpragfm","xiusfbwdt","btoapmlzy","ewklasbzq","skaxiregz","azpuvbcom","femhujlgo","aortwnlmq","apmtdiejn","drcqxuyew","fgcqolapx","sbpvftinx","twuaqvhsn","mujexpwko","vasglqekf","hcagbvotr","nilztukov","taqukwnpo","udixsnomg","hdsbuzoev","jskilhbau","uwozhmcjs","gwrjosdka","qtryhmzde","hzpdyfnwe","staoldxjf","nlepmufrb","xkjhrncso","jzflontdp","fswoivybj","xmujentoz","psfmheyto","pzbmdnwia","ejahrfnot","dpfljeuwi","tamkrginq","mhbfsnqur","kylihconj","doamqbzsw","fyzognpjs","dzopytfne","iybluecgo","zgrohndte","mcrawplyi","ubteqvsag","qjhtdleun","ircuqnpyo","ysrjpgbov","vsiznweaf"]');
    return json[key];
}

function getWords() {
    var words = JSON.parse('["abbe","abed","abet","able","ably","abut","aced","aces","ache","achy","acid","acme","acne","acre","acts","adds","adit","advt","aeon","afar","afro","agar","aged","ages","agin","agog","ague","ahem","ahoy","aide","aids","ails","aims","airs","airy","ajar","akin","alar","alas","alba","albs","alee","ales","alga","ally","alms","aloe","alps","also","alto","alum","amah","amen","amid","ammo","amps","amyl","anal","ands","anew","anis","ankh","anna","anon","ante","anti","ants","anus","aped","apes","apex","apse","aqua","arch","arco","arcs","area","ares","aria","arid","arks","arms","army","arse","arts","arty","arum","asap","ashy","asks","asps","atom","atop","attn","auks","auld","aunt","aura","auto","aver","aves","avid","avis","avow","away","awed","awes","awls","awns","awol","awry","axed","axel","axes","axil","axis","axle","axon","ayah","ayes","baas","baba","babe","babu","baby","bach","back","bade","bags","baht","bail","bait","bake","bald","bale","balk","ball","balm","band","bane","bang","bank","bans","barb","bard","bare","barf","bark","barn","bars","base","bash","bask","bass","bast","bate","bath","bats","baud","bawd","bawl","bays","bead","beak","beam","bean","bear","beat","beau","beck","beds","beef","been","beep","beer","bees","beet","begs","bell","belt","bema","bend","bens","bent","berg","berm","best","beta","bets","bevy","beys","bias","bibs","bide","bids","bier","biff","bike","bile","bilk","bill","bind","bins","bios","bird","bite","bits","blab","blah","blat","bled","blew","blip","blob","bloc","blot","blow","blue","blur","boar","boas","boat","bobs","bock","bode","bods","body","boff","bogs","bogy","boil","bola","bold","bole","boll","bolo","bolt","bomb","bond","bone","bong","bony","boob","book","boom","boon","boor","boos","boot","bops","bore","born","bort","bosh","boss","both","bout","bowl","bows","boxy","boyo","boys","bozo","brad","brae","brag","bran","bras","brat","bray","bred","brew","brie","brig","brim","brio","brit","bros","brow","brut","bubo","buck","buds","buff","bugs","bulb","bulk","bull","bump","bums","bund","bung","bunk","buns","bunt","buoy","burg","burl","burn","burp","burr","burs","bury","bush","bust","busy","buts","butt","buys","buzz","byes","byre","byte","cabs","cads","cafe","cage","cagy","cake","calc","calf","calk","call","calm","calx","came","camp","cams","cane","cans","cant","cape","caps","card","care","carl","carp","cars","cart","casa","case","cash","cask","cast","cats","caul","cave","cavy","caws","cays","ceca","cede","ceil","cell","celt","cent","cert","cess","chad","cham","chap","char","chat","chaw","chef","chew","chez","chia","chic","chid","chin","chip","chit","chop","chow","chub","chug","chum","ciao","cine","cite","city","clad","clam","clan","clap","claw","clay","clef","clew","clip","clod","clog","clop","clot","cloy","club","clue","coal","coat","coax","cobs","cock","coco","coda","code","cods","coed","cogs","coho","coif","coil","coin","coir","coke","cola","cold","cole","coll","colt","coma","comb","come","comp","cone","conk","conn","cons","cont","cony","cook","cool","coon","coop","coos","coot","cope","cops","copy","cord","core","cork","corm","corn","corp","cosh","cost","cosy","cote","cots","coup","cove","cowl","cows","cozy","crab","crag","cram","crap","craw","crew","crib","crop","crow","crud","crux","cube","cubs","cuff","cuke","cull","cult","cunt","cups","curb","curd","cure","curl","curs","curt","cusp","cuss","cute","cuts","cyan","cyme","cyst","czar","dabs","dace","dada","dado","dads","daft","dago","dais","dale","dame","damn","damp","dams","dang","dank","dare","dark","darn","dart","dash","data","date","daub","dawn","days","daze","dead","deaf","deal","dean","dear","debs","debt","deck","deco","deed","deem","deep","deer","dees","deft","defy","dele","deli","dell","demo","dens","dent","deny","dept","derm","desk","deva","dews","dewy","dhow","dial","dibs","dice","dick","dido","died","dies","diet","digs","dike","dill","dime","dims","dine","ding","dins","dint","dips","dire","dirk","dirt","disc","dish","disk","diva","dive","dock","docs","dodo","doer","does","doff","doge","dogs","dojo","dole","doll","dolt","dome","done","dong","dons","doom","door","dope","dopy","dorm","dorp","dors","dory","doss","dost","dote","doth","dots","dour","dove","down","doxy","doze","dozy","drag","dram","drat","draw","dray","drek","drew","drip","drop","drub","drug","drum","drys","duad","dual","dubs","duck","duct","dude","duds","duel","dues","duet","duff","dugs","duke","dull","duly","dumb","dump","dune","dung","duns","duos","dupe","durn","dusk","dust","duty","dyad","dyed","dyer","dyes","dyke","dyne","each","earl","earn","ears","ease","east","easy","eats","eave","ebbs","ebon","echo","ecru","ecus","eddy","edge","edgy","edit","eels","effs","efts","egad","eggs","egos","eked","ekes","elan","elks","ells","elms","else","emir","emit","emus","ends","envy","eons","epee","epic","eras","ergo","ergs","erne","errs","erst","eses","espy","etch","even","ever","eves","evil","ewer","ewes","exam","exec","exes","exit","expo","eyed","eyes","face","fact","fade","fads","fags","fail","fain","fair","fake","fall","fame","fang","fans","fare","farm","faro","fart","fast","fate","fats","faun","faux","fawn","fays","faze","fear","feat","feds","feed","feel","fees","feet","fell","felt","fend","fens","fern","fess","feta","fete","feud","fiat","fibs","fido","fids","fief","fife","figs","file","fill","film","find","fine","fink","fins","fire","firm","firs","fish","fist","fits","five","fizz","flab","flag","flak","flan","flat","flaw","flax","flay","flea","fled","flee","flew","flex","flip","flit","floe","flog","flop","flow","flub","flue","flux","foal","foam","fobs","foci","foes","fogs","fogy","foil","fold","folk","fond","font","food","fool","foot","fops","fora","ford","fore","fork","form","fort","foul","four","fowl","foxy","frag","frat","frau","fray","free","fret","frig","frog","from","frow","frug","fuck","fuel","fugs","fuji","full","fume","fund","funk","furl","furs","fury","fuse","fuss","fuze","fuzz","gabs","gads","gaff","gaga","gage","gags","gain","gait","gala","gale","gall","gals","game","gams","gamy","gang","gaol","gape","gaps","garb","gars","gash","gasp","gate","gats","gaud","gave","gawk","gays","gaze","gear","geed","geek","gees","geld","gels","gelt","gems","gene","gens","gent","germ","gets","geum","ghat","ghee","gibe","gibs","gift","gigs","gild","gill","gilt","gimp","gins","gird","girl","girt","gist","give","glad","glee","glen","glib","glim","glob","glom","glop","glow","glue","glum","glut","gnat","gnaw","gnus","goad","goal","goat","gobs","goby","gods","goer","goes","gogo","gold","golf","gone","gong","good","goof","gook","goon","goop","gore","gory","gosh","goth","gout","govt","gown","goys","grab","grad","gram","gray","grew","grey","grid","grim","grin","grip","grit","grog","grot","grow","grub","guar","guck","guff","gulf","gull","gulp","gums","gunk","guns","guru","gush","gust","guts","guys","gyms","gyps","gyre","gyro","gyve","hack","hadj","haft","hags","hail","hair","haji","hajj","hake","hale","half","hall","halo","halt","hams","hand","hang","hank","haps","hard","hare","hark","harm","harp","hart","hash","hasp","hast","hate","hath","hats","haul","have","hawk","haws","hays","haze","hazy","head","heal","heap","hear","heat","heck","heed","heel","heft","heir","held","helm","help","heme","hemp","hems","hens","herb","herd","here","hero","hers","hest","hewn","hews","hick","hide","hied","hies","high","hike","hill","hilt","hind","hint","hips","hire","hiss","hist","hits","hive","hoar","hoax","hobo","hobs","hock","hods","hoed","hoes","hogs","hoke","hold","hole","holt","holy","home","homo","homy","hone","honk","hood","hoof","hook","hoop","hoot","hope","hops","hora","horn","hose","host","hots","hour","hove","howe","howl","hubs","huck","hued","hues","huff","huge","hugs","hula","hulk","hull","hump","hums","hung","hunk","huns","hunt","hurl","hurt","hush","husk","huts","hymn","hype","hypo","iamb","ibex","ibid","ibis","iced","ices","icky","icon","idea","idem","ides","idle","idly","idol","idyl","iffy","ikon","ilia","ills","imam","imps","inca","inch","info","inks","inky","inly","inns","into","ions","iota","iris","irks","iron","isle","isms","ital","itch","item","ixia","jabs","jack","jade","jags","jail","jake","jamb","jams","jane","jape","jars","jato","java","jaws","jays","jazz","jean","jeep","jeer","jeez","jefe","jell","jerk","jess","jest","jets","jews","jibe","jibs","jiff","jigs","jill","jilt","jinn","jinx","jive","jobs","jock","joes","joey","jogs","john","join","joke","jolt","josh","joss","jota","jots","jowl","joys","judo","jugs","juju","juke","jump","junk","jury","just","jute","juts","kaka","kale","kame","kart","kayo","keel","keen","keep","kegs","kelp","keno","kens","kent","kepi","kept","kerb","kerf","kern","keys","khan","kick","kids","kike","kill","kiln","kilo","kilt","kind","kine","king","kink","kins","kips","kirk","kiss","kist","kith","kits","kiwi","knee","knew","knit","knob","knot","know","koan","kohl","kola","kook","koto","kris","kudu","kyat","labs","lace","lack","lacy","lade","lads","lady","lags","laid","lain","lair","lake","lama","lamb","lame","lamp","lams","land","lane","lank","laps","lard","lark","lash","lass","last","late","lath","laud","lava","lave","lawn","laws","lays","laze","lazy","lead","leaf","leak","leal","lean","leap","leas","lech","leek","leer","lees","left","legs","leis","leks","lend","lens","lent","less","lest","lets","leva","levo","levy","lewd","leys","liar","libs","lice","lick","lido","lids","lied","lief","lien","lies","lieu","life","lift","like","lilt","lily","limb","lime","limn","limo","limp","line","ling","link","lino","lint","lion","lips","lira","lire","lisp","list","lite","lith","live","load","loaf","loam","loan","lobe","lobo","lobs","loch","loci","lock","loco","lode","loft","loge","logo","logs","logy","loin","loll","lone","long","loom","loon","loop","loos","loot","lope","lops","lord","lore","lorn","lory","lose","loss","lost","loth","lots","loud","loup","lour","lout","love","lows","luau","lube","luck","luff","luge","lugs","lull","lulu","lump","lune","lung","lunk","lure","lurk","lush","lust","lute","luxe","lynx","lyre","mace","mack","macs","made","mads","mage","magi","mags","maid","mail","maim","main","make","mala","male","mali","mall","malt","mama","mane","mans","many","maps","marc","mare","mark","marl","mars","mart","mary","mash","mask","mass","mast","mate","math","mats","matt","maul","maws","maxi","maya","mayo","mays","maze","mazy","mead","meal","mean","meat","mech","meed","meek","meet","meld","melt","memo","mend","menu","meow","mere","mesa","mesh","mess","meta","mete","mewl","mews","mica","mice","mick","midi","mien","miff","mike","mild","mile","milk","mill","mils","milt","mime","mind","mine","ming","mini","mink","mint","minx","mire","mirk","mirv","miry","misc","miso","miss","mist","mite","mitt","moan","moas","moat","mobs","mock","mode","mods","moil","mold","mole","moll","molt","moly","moms","monk","mono","mons","mony","mood","moon","moor","moos","moot","mope","mops","more","morn","mort","moss","most","mote","moth","mots","moue","move","mown","mows","moxa","much","muck","muds","muff","mugs","mule","mull","mums","muon","murk","muse","mush","musk","muss","must","mute","mutt","myna","myth","nabs","nags","naif","nail","name","nape","naps","narc","nard","nark","nary","nato","nave","navy","nays","nazi","neap","near","neat","nebs","neck","need","neon","nerd","ness","nest","nets","nevi","news","newt","next","nibs","nice","nick","nigh","nils","nine","nips","nits","nobs","nock","node","nods","noel","noes","nogs","noir","nome","noms","none","nook","noon","nope","norm","nose","nosh","nosy","nota","note","nots","noun","nous","nova","nude","nuke","null","numb","nuns","nuts","oafs","oaks","oars","oath","oats","obey","obis","obit","oboe","obol","odds","ofay","offs","ogee","ogle","ogre","ohms","oils","oily","oink","okay","okie","okra","olds","oleo","olio","omen","omit","once","ones","only","onto","onus","onyx","oohs","oops","ooze","opal","open","opes","opts","opus","oral","orbs","orca","orcs","ores","orgy","orts","oryx","otic","otto","ouch","ours","oust","outs","ouzo","oval","oven","over","ovum","owed","owes","owls","owns","oxen","oyez","pace","pack","pact","pads","page","paid","pail","pain","pair","pale","pall","palm","pals","pane","pang","pans","pant","papa","paps","para","pard","pare","park","pars","part","pass","past","pate","path","pats","pave","pawl","pawn","paws","pays","peak","peal","pean","pear","peas","peat","peck","peds","peed","peek","peel","peen","peep","peer","pees","pegs","peke","pelf","pelt","pens","pent","peon","peps","pere","perk","perm","pert","peso","pest","pets","pews","phew","phiz","pica","pick","pics","pied","pier","pies","pigs","pike","pile","pill","pima","pimp","pine","ping","pink","pins","pint","piny","pion","pipe","pips","pish","piss","pita","pith","pits","pity","pixy","plan","plat","play","plea","pled","plod","plop","plot","plow","ploy","plug","plum","plus","pock","pods","poem","poet","poke","poky","pole","poll","polo","pols","poly","pome","pomp","pond","pone","pong","pons","pony","pooh","pool","poop","poor","pope","pops","pore","pork","porn","port","pose","posh","post","posy","pots","pouf","pour","pout","pows","pram","prat","pray","prep","pres","prey","prig","prim","prod","prof","prom","prop","pros","prow","psst","pubs","puce","puck","puds","puff","pugs","puke","pule","pull","pulp","puma","pump","punk","puns","punt","puny","pupa","pups","pure","purl","purr","push","puss","puts","putt","pyre","quad","quag","quay","quid","quip","quit","quiz","quod","race","rack","racy","rads","raft","raga","rage","rags","raid","rail","rain","raja","rake","ramp","rams","rand","rang","rani","rank","rant","raps","rapt","rare","rase","rash","rasp","rata","rate","rats","rave","rays","raze","razz","read","real","ream","reap","rear","rebs","recs","redo","reds","reed","reef","reek","reel","refs","reft","rein","rely","rend","reno","rent","reps","rest","retd","revs","rhea","rial","ribs","rice","rich","rick","ride","rids","riel","rife","riff","rift","rigs","rile","rill","rime","rims","rimy","rind","ring","rink","riot","ripe","rips","rise","risk","rite","ritz","rive","road","roam","roan","roar","robe","robs","rock","rocs","rode","rods","roes","roil","role","roll","romp","rood","roof","rook","room","root","rope","ropy","rose","rosy","rote","rots","rout","roux","rove","rows","rube","rubs","ruby","ruck","rude","rued","rues","ruff","rugs","ruin","rule","rump","rums","rune","rung","runs","runt","ruse","rush","rusk","rust","ruth","ruts","ryes","sack","sacs","safe","saga","sage","sago","sags","said","sail","sake","sale","salt","same","sand","sane","sang","sank","sans","saps","sari","sash","sass","sate","save","sawn","saws","says","scab","scad","scag","scam","scan","scar","scat","scot","scow","scud","scum","scut","seal","seam","sear","seas","seat","secs","sect","seed","seek","seem","seen","seep","seer","sees","self","sell","semi","send","sent","sept","sera","sere","serf","sets","sewn","sews","sexy","shad","shag","shah","sham","shat","shay","shed","shes","shew","shim","shin","ship","shit","shiv","shod","shoe","shoo","shop","shot","show","shul","shun","shut","sibs","sick","sics","side","sigh","sign","silk","sill","silo","silt","simp","sine","sing","sinh","sink","sins","sips","sire","sirs","site","sits","size","skag","skew","skid","skim","skin","skip","skis","skit","slab","slag","slam","slap","slat","slaw","slay","sled","slew","slid","slim","slip","slit","slob","sloe","slog","slop","slot","slow","slue","slug","slum","slur","slut","smit","smog","smug","smut","snag","snap","snip","snit","snob","snot","snow","snub","snug","soak","soap","soar","sobs","sock","soda","sods","sofa","soft","soil","sold","sole","soli","solo","soma","some","song","sons","soon","soot","sops","sore","sort","sots","soul","soup","sour","sown","sows","soya","soys","span","spar","spas","spat","spay","spec","sped","spew","spic","spin","spit","spot","spry","spud","spun","spur","stab","stag","star","stat","stay","stem","step","stet","stew","stir","stoa","stop","stow","stub","stud","stun","stye","subs","such","suck","suds","sued","sues","suet","suit","sulk","sumo","sump","sums","sung","sunk","suns","sups","supt","sure","surf","swab","swag","swam","swan","swap","swat","sway","swig","swim","swob","swop","swum","sync","syne","tabs","tabu","tach","tack","taco","tact","tads","tags","tail","take","talc","tale","talk","tall","tame","tamp","tams","tang","tank","tans","taos","tape","taps","tare","tarn","taro","tarp","tars","tart","task","tass","tats","taut","taws","taxi","tbsp","teak","teal","team","tear","teas","teat","tech","teds","teed","teem","teen","tees","tell","temp","tend","tens","tent","term","tern","test","text","than","that","thaw","thee","them","then","thew","they","thin","this","thro","thru","thud","thug","thus","tick","tics","tide","tidy","tied","tier","ties","tiff","tike","tile","till","tilt","time","tine","ting","tins","tint","tiny","tipi","tips","tire","tiro","tits","toad","toed","toes","toff","tofu","toga","togs","toil","toke","told","tole","toll","tomb","tome","toms","tone","tong","tons","tony","took","tool","toot","tope","tops","torc","tore","torn","toro","tors","tort","tory","tosh","toss","tote","tots","tour","tout","town","toys","tram","trap","tray","tree","trek","trey","trig","trim","trio","trip","trod","trot","trow","troy","true","tsar","tuba","tube","tubs","tuck","tufa","tuff","tuft","tugs","tuna","tune","tuns","tups","turd","turf","turn","tush","tusk","tuts","tutu","twat","twig","twin","twit","twos","tyke","type","typo","tyre","tyro","tzar","ufos","ugly","ukes","ulna","umps","unco","undo","undy","unit","unix","unto","upon","urbs","urea","urge","uric","urns","used","user","uses","vail","vain","vale","vamp","vane","vans","vary","vase","vast","vats","veal","veep","veer","vees","veil","vein","vela","veld","vend","vent","verb","vert","very","vest","veto","vets","vial","vice","vide","vied","vies","view","vile","vine","vino","viol","visa","vise","vita","viva","void","vole","volt","vote","vows","vugs","wack","wade","wadi","wads","waft","wage","wags","waif","wail","wain","wait","wake","wale","walk","wall","wand","wane","want","ward","ware","warm","warn","warp","wars","wart","wary","wash","wasp","wast","wats","watt","waul","wave","wavy","waxy","ways","weak","weal","wear","webs","weds","weed","week","ween","weep","weft","weir","weld","well","welt","wend","wens","went","wept","were","west","wets","wham","whap","what","whee","when","whet","whew","whey","whig","whim","whip","whir","whit","whiz","whoa","whom","whys","wick","wide","wife","wigs","wild","wile","will","wilt","wily","wind","wine","wing","wink","wino","wins","wipe","wire","wiry","wise","wish","wisp","with","wits","wive","woad","woes","woke","woks","wold","wolf","womb","wont","wood","woof","wool","woos","wops","word","wore","work","worm","worn","wort","wove","wows","wrap","wren","writ","wyes","yack","yaks","yale","yams","yang","yank","yaps","yard","yare","yarn","yawl","yawn","yawp","yaws","yeah","year","yeas","yegg","yell","yelp","yens","yeti","yews","yids","yipe","yips","yoga","yogi","yoke","yolk","yond","yoni","yore","york","yowl","yuan","yuks","yule","yurt","zags","zany","zaps","zeal"]');
    return words;
}

function getValidWords(string) {
    var found = 0;
    var words = [];
    var allWords = getWords();
  
      for (var i = 0; i < allWords.length; i++) {
  
        var found_letters = 0;
        var s = allWords[i];

          for (var t = 0; t < s.length; t++) {
  
            if (string.includes(s.charAt(t))) {
                found_letters++;
              }
            if(found_letters == 4) {
                words.push(allWords[i])
                found++;
            }
  
        }
  
    }
    return words;
}