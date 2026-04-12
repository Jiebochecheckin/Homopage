// ==========================================
// 在这里手动修改你的代理订阅文本！
// ==========================================
const PROXY_UPDATE_TEXT = "4.12 新链接";

document.getElementById('proxy-text').textContent = PROXY_UPDATE_TEXT;


// 1. VPN 状态检测 (图片防卡死 + 严格 3 秒超时版)
class VPNDetector {
    constructor() {
        this.statusCard = document.getElementById('vpn-status');
        this.statusText = document.getElementById('vpn-text');
        this.timeout = 3000; // 3秒超时判定
    }

    check() {
        this.setStatus('checking', '检测中...');
        const img = new Image();
        let isFinished = false; // 防止成功和失败重复触发
        
        // 设定超时计时器
        const timer = setTimeout(() => {
            if (isFinished) return;
            isFinished = true;
            img.src = ''; // 强行阻断图片加载
            this.setStatus('disconnected', '未连接/延迟较高');
        }, this.timeout);

        img.onload = () => {
            if (isFinished) return;
            isFinished = true;
            clearTimeout(timer);
            this.setStatus('connected', '已连接');
        };
        
        img.onerror = () => {
            if (isFinished) return;
            isFinished = true;
            clearTimeout(timer);
            this.setStatus('disconnected', '未连接');
        };

        // 使用 Google Favicon 测试，加上时间戳防缓存
        img.src = `https://www.google.com/favicon.ico?t=${Date.now()}`;
    }

    setStatus(status, text) {
        this.statusCard.className = `status-card ${status}`;
        this.statusText.textContent = text;
    }
}


// 2. Bing 搜索与自动联想
class SearchManager {
    constructor() {
        this.input = document.getElementById('search-input');
        this.btn = document.getElementById('search-btn');
        this.suggestions = document.getElementById('search-suggestions');
        this.debounceTimer = null;
        this.init();
    }

    init() {
        // 回车搜索
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.doSearch();
        });

        // 按钮点击搜索
        this.btn.addEventListener('click', () => {
            this.doSearch();
        });

        // 监听输入触发联想
        this.input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            clearTimeout(this.debounceTimer);
            
            if (!query) {
                this.suggestions.classList.add('hidden');
                return;
            }

            // 防抖：停止打字 300ms 后才发请求
            this.debounceTimer = setTimeout(() => {
                const script = document.createElement('script');
                script.src = `https://api.bing.com/qsonhs.aspx?type=cb&q=${encodeURIComponent(query)}&cb=bingSuggestCallback`;
                document.body.appendChild(script);
                script.onload = () => script.remove();
            }, 300);
        });

        // 点击页面空白处隐藏下拉框
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.suggestions.classList.add('hidden');
            }
        });

        // JSONP 回调函数
        window.bingSuggestCallback = (data) => {
            this.suggestions.innerHTML = '';
            if (data && data.AS && data.AS.Results && data.AS.Results[0].Suggests) {
                const suggests = data.AS.Results[0].Suggests;
                suggests.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item.Txt;
                    li.addEventListener('click', () => {
                        this.input.value = item.Txt;
                        this.suggestions.classList.add('hidden');
                        this.doSearch();
                    });
                    this.suggestions.appendChild(li);
                });
                this.suggestions.classList.remove('hidden');
            } else {
                this.suggestions.classList.add('hidden');
            }
        };
    }

    doSearch() {
        const query = this.input.value.trim();
        if (query) {
            window.location.href = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
        }
    }
}


// 3. 大字标题时钟功能
function initClock() {
    const clockEl = document.getElementById('clock-title');
    if (!clockEl) return;

    function updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        clockEl.textContent = `${hours}:${minutes}`;
    }
    
    updateTime(); // 立即执行避免闪烁
    setInterval(updateTime, 1000);
}

// 初始化运行
document.addEventListener('DOMContentLoaded', () => {
    const vpnDetector = new VPNDetector();
    new SearchManager();
    initClock();

    // 初始化检测 VPN，并每隔 30 秒检测一次
    vpnDetector.check();
    setInterval(() => vpnDetector.check(), 30000);
});
