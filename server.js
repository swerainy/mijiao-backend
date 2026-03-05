const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000; // 服务器运行的端口

// 允许跨域请求（让你的前端网页能访问到后端）
app.use(cors());
// 允许解析 JSON 格式的请求体
app.use(express.json());

// 存放数据的本地文件路径
const dataFile = path.join(__dirname, 'collected_sequences.json');

// 接收前端发来的数据
app.post('/uploadSequence', (req, res) => {
    const sequence = req.body.sequence;

    // 安全校验
    if (!Array.isArray(sequence) || sequence.length < 2) {
        return res.status(400).json({ success: false, message: "数据不合法或过短" });
    }

    // 整理要保存的记录
    const record = {
        time: new Date().toISOString(),
        sequence: sequence
    };

    // 将数据追加保存到文件中（每行一条 JSON，方便以后大数据分析读取）
    fs.appendFile(dataFile, JSON.stringify(record) + '\n', (err) => {
        if (err) {
            console.error('保存数据失败:', err);
            return res.status(500).json({ success: false, message: "服务器保存失败" });
        }
        console.log('成功收集到一条新数据！');
        res.json({ success: true, message: "上传成功" });
    });
});

// 让前端获取分析好的规律
app.get('/getRules', (req, res) => {
    const rulesFile = path.join(__dirname, 'rules.json');
    
    // 检查规律文件存不存在
    if (fs.existsSync(rulesFile)) {
        const rulesData = fs.readFileSync(rulesFile, 'utf-8');
        res.json({ success: true, rules: JSON.parse(rulesData) });
    } else {
        // 如果还没生成过，就返回空对象
        res.json({ success: true, rules: {} });
    }
});

app.listen(PORT, () => {
    console.log(`服务器已启动，正在监听端口 ${PORT}...`);
});