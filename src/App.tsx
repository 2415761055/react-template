// src/App.tsx (最终架构修正版)

import React, { useState, useEffect } from 'react';
// 我们不再需要从SDK引入那么多类型，因为我们会直接使用正确的方法
import { bitable, IOpenSingleSelect } from '@lark-base-open/js-sdk';
import { Button, Spin, Tag, Alert } from 'antd'; 

const BACKEND_URL = 'https://video-analysis-backend.vercel.app'; // !! 请确保替换成您自己的URL

function App() {
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
    const [currentStatus, setCurrentStatus] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [activeTableId, setActiveTableId] = useState<string | null>(null);
    const [taskTableId, setTaskTableId] = useState<string | null>(null);

    // 插件加载时，执行一次初始化操作
    useEffect(() => {
        async function initializePlugin() {
            try {
                const [tableList, selection] = await Promise.all([
                    bitable.base.getTableMetaList(),
                    // 修正：从 bitable.base 调用 getSelection
                    bitable.base.getSelection(),
                ]);

                const taskTableMeta = tableList.find(table => table.name === '视频任务');
                if (taskTableMeta) {
                    setTaskTableId(taskTableMeta.id);
                }
                
                setActiveTableId(selection.tableId);
                if (selection.tableId === taskTableMeta?.id) {
                    setSelectedRecordId(selection.recordId);
                }
            } catch (error) {
                console.error("初始化插件时出错:", error);
                setErrorMessage("初始化插件失败，请检查控制台。");
            }
        }
        initializePlugin();
    }, []);

    // 监听整个应用的选择变化事件
    useEffect(() => {
        // 修正：从 bitable.base 调用 onSelectionChange
        // 修正：为 event 参数提供正确的内联类型定义
        const off = bitable.base.onSelectionChange(async (event: { data: { tableId: string | null; recordId: string | null; viewId: string | null; fieldId: string | null; } }) => {
            setActiveTableId(event.data.tableId);
            
            if (event.data.recordId && event.data.tableId === taskTableId) {
                setSelectedRecordId(event.data.recordId);
                try {
                    const table = await bitable.base.getTableById(taskTableId!);
                    const statusCell = await table.getCellValue('分析状态', event.data.recordId);

                    if (Array.isArray(statusCell) && statusCell.length > 0 && typeof (statusCell[0] as IOpenSingleSelect).text === 'string') {
                        setCurrentStatus((statusCell[0] as IOpenSingleSelect).text);
                    } else {
                        setCurrentStatus('待处理');
                    }
                } catch (e) {
                    setCurrentStatus('未知');
                }
            } else {
                setSelectedRecordId(null);
                setCurrentStatus('');
            }
        });

        return () => {
            off();
        };
    }, [taskTableId]); // 依赖 taskTableId，确保在获取到它之后再进行判断

    const handleAnalyzeClick = async () => {
        if (!selectedRecordId) return;
        setIsLoading(true);
        setErrorMessage('');
        setCurrentStatus('分析中');
        try {
            const response = await fetch(`${BACKEND_URL}/api/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ record_id: selectedRecordId }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '后端服务器返回未知错误');
            setCurrentStatus('已完成');
        } catch (err: any) {
            setErrorMessage(err.message);
            setCurrentStatus('失败');
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderContent = () => {
        if (activeTableId && taskTableId && activeTableId !== taskTableId) {
             return <Alert message="请切换到「视频任务」表以使用本插件。" type="warning" showIcon />;
        }
        if (!selectedRecordId) {
            return <Alert message="请在「视频任务」表中选中任意一个任务行。" type="info" showIcon />;
        }
        return (
            <div>
                <p>当前任务状态: <Tag color={
                    currentStatus === '已完成' ? 'success' : 
                    currentStatus === '分析中' ? 'processing' : 
                    currentStatus === '失败' ? 'error' : 'default'
                }>{currentStatus || '待处理'}</Tag></p>
                <Spin spinning={isLoading} tip="AI正在全力分析中，请耐心等候...">
                    <Button 
                        type="primary" 
                        size="large" 
                        onClick={handleAnalyzeClick} 
                        disabled={isLoading || !selectedRecordId || currentStatus === '分析中'}
                        style={{ width: '100%', marginTop: '10px' }}
                    >
                        {currentStatus === '分析中' ? '正在分析...' : '开始分析'}
                    </Button>
                </Spin>
                {errorMessage && <Alert message={`分析失败: ${errorMessage}`} type="error" showIcon style={{ marginTop: '15px' }} />}
                {currentStatus === '完成' && <Alert message="分析完成！请在「AI分析详情」表中查看各个视角的详细分析结果。" type="success" showIcon style={{ marginTop: '15px' }}/>}
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>视频多维分析插件</h2>
            {renderContent()}
        </div>
    );
}

export default App;