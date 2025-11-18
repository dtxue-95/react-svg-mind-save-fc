import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App, { AppRef, DataChangeInfo, RawNode } from './App';
import { mockInitialData } from './mockData';
import './styles.css'

// 模拟一个后端 API
const fakeApi = {
  // 接收前端数据，处理后返回更新后的完整数据
  saveData: (data: RawNode): Promise<{ success: boolean, updatedData: RawNode }> => {
    console.log("正在向服务器保存数据...", data);
    
    // 模拟后端处理：给根节点名称加上后缀，并新增一个子节点
    // FIX: Explicitly type the new node object as RawNode before adding it to the childNodeList. This ensures the `updatedDataFromServer` object correctly matches the `RawNode` type expected by the `fakeApi.saveData` return promise.
    const newNode: RawNode = {
      id: `server-id-${Date.now()}`,
      uuid: crypto.randomUUID(),
      name: "✨ 后端添加的节点",
      nodeType: "moduleNode",
      generateModeName: 'AI',
    };
    const updatedDataFromServer = {
      ...data,
      name: `${data.name} (已保存)`,
      childNodeList: [
        ...(data.childNodeList || []),
        newNode,
      ]
    };

    return new Promise(resolve => {
      setTimeout(() => {
        console.log("保存成功！后端返回了更新后的数据。", updatedDataFromServer);
        resolve({ success: true, updatedData: updatedDataFromServer });
      }, 1000); // 模拟1秒的网络延迟
    });
  },
};


function ComprehensiveExample() {
    const mindMapRef = useRef<AppRef>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [statusText, setStatusText] = useState('请修改节点内容，然后点击外部保存按钮。');

    // 组件加载后，延时设为可编辑模式，方便演示
    useEffect(() => {
        const timer = setTimeout(() => {
            mindMapRef.current?.setReadOnly(false);
            setStatusText('现在可以编辑了。');
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const handleSave = async () => {
        if (!mindMapRef.current) {
            alert("Mind Map 组件尚未加载完成。");
            return;
        }

        setIsSaving(true);
        setStatusText('正在保存...');

        // 1. 从组件获取当前最新的数据
        const saveData = mindMapRef.current.save();
        
        try {
            // 2. 将数据发送到后端
            const result = await fakeApi.saveData(saveData.currentRawData);

            if (result.success) {
                // 3. API 成功后，使用 syncData 更新前端，并保留视图
                setStatusText('保存成功！正在同步最新数据...');
                mindMapRef.current.syncData(result.updatedData);

                // 4. (最佳实践) 保存成功后，重置历史并设为只读
                mindMapRef.current.setReadOnly(true);
                
                setTimeout(() => setStatusText('同步完成！已设为只读模式。'), 500);
            } else {
                alert("保存失败，请重试。");
                setStatusText('保存失败！');
            }
        } catch (error) {
            alert("保存时发生未知错误。");
            setStatusText('保存出错！');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
                padding: '10px', 
                background: '#f0f0f0', 
                borderBottom: '1px solid #ddd', 
                display: 'flex', 
                alignItems: 'center',
                gap: '20px',
                flexShrink: 0 
            }}>
                <button onClick={handleSave} disabled={isSaving} style={{ padding: '8px 16px', fontSize: '16px' }}>
                    {isSaving ? '保存中...' : '外部保存按钮'}
                </button>
                <p style={{ margin: 0 }}>{statusText}</p>
            </div>
            <div style={{ flexGrow: 1, position: 'relative' }}>
                 <App
                    ref={mindMapRef}
                    initialData={mockInitialData}
                    // onSave 回调是用于处理内部 "保存" 按钮的，我们这里用的是外部按钮
                    // 但你也可以在这里绑定 handleSave 函数
                 />
            </div>
        </div>
    );
}


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ComprehensiveExample />
  </React.StrictMode>
);