const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'collected_sequences.json');
const rulesFile = path.join(__dirname, 'rules.json');

console.log('开始分析数据挖掘规律...');

try {
    // 1. 读取所有收集到的数据
    const fileContent = fs.readFileSync(dataFile, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    // 用来统计每个事件后面跟着什么事件的次数
    const transitions = {};

    // 2. 遍历每一条玩家记录
    lines.forEach(line => {
        try {
            const record = JSON.parse(line);
            const seq = record.sequence;
            
            // 为了简化分析，如果遇到并行事件(数组)，我们取第一个主事件来作为规律基准
            const flatSeq = seq.map(item => Array.isArray(item) ? item[0] : item).filter(Boolean);

            // 统计先后顺序
            for (let i = 0; i < flatSeq.length - 1; i++) {
                const currentEvent = flatSeq[i];
                const nextEvent = flatSeq[i + 1];

                if (!transitions[currentEvent]) {
                    transitions[currentEvent] = { total: 0, nextEvents: {} };
                }
                
                transitions[currentEvent].total += 1; // currentEvent 出现的总次数
                
                if (!transitions[currentEvent].nextEvents[nextEvent]) {
                    transitions[currentEvent].nextEvents[nextEvent] = 0;
                }
                transitions[currentEvent].nextEvents[nextEvent] += 1; // 跟着 nextEvent 的次数
            }
        } catch (err) {
            // 忽略格式错误的单行数据
        }
    });

    // 3. 提炼规律（过滤掉偶然事件）
    const rules = {};
    for (const event in transitions) {
        const data = transitions[event];
        
        // 算出后续事件的概率，并筛选
        const predicted = Object.entries(data.nextEvents)
            .map(([name, count]) => ({
                name,
                count,
                probability: count / data.total // 计算概率
            }))
            .filter(item => item.probability > 0.2) // 【关键配置】：只保留出现概率大于 20% 的后续事件
            .sort((a, b) => b.probability - a.probability) // 按概率从高到低排序
            .map(item => item.name); // 只要名字

        if (predicted.length > 0) {
            rules[event] = predicted;
        }
    }

    // 4. 将提炼出的纯净规律保存为 rules.json
    fs.writeFileSync(rulesFile, JSON.stringify(rules, null, 2));
    console.log('🎉 挖掘完成！共分析了', lines.length, '条记录。');
    console.log('已生成规律文件：rules.json');

} catch (error) {
    console.error('分析失败，可能是还没有数据文件：', error.message);
}