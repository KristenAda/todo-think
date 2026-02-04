export const echartOption1 = (data1) => {
    const colors = ["#6080E8", "#F0C27F", "#AEE0F9", "#F7A7A4", '#2EAA1D', '#34A4FB']
    return {
        //  title: {
        //         text: '两组堆叠柱状图示例',
        //         left: 'center',
        //         top: 20
        //     },
         tooltip: {
            trigger: "axis",
            axisPointer: {
                type: "shadow",
            },
        },
        legend: {
            // orient: "ver",
            show: true,
            // right: 0,
            left: "center",
            itemGap: 10,
            // width: '50%',
            top: 0,            // icon: "circle",
            textStyle: {
                // 使用回调函数为每个图例项设置颜色
                fontSize: 10,
                // color: function (params: any) {
                //     // 找到当前图例项的索引
                //     const index = data1.findIndex(item => item === params.mgtOrgName);
                //     // 返回对应颜色（使用自定义颜色或ECharts默认颜色）
                //     return colors[index]
                // }
            }

            // itemGap: 10, // 设置图例项之间的间距
        },
        grid: {
            left: "1%",
            right: "3%",
            //   top:'2%',
            bottom: "1%",
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: data1.map((item) => { return item.name }),
            axisTick: {
                show: false // 不显示刻度线
            },
            axisLabel: {
                interval: 0, // 0 表示强制显示所有标签
                // 其他可选样式优化
                rotate: 0, // 标签旋转（避免重叠，可选 30/45/90 度）
                // interval: 0,
                // 调整标签与轴线的距离
                margin: 15,
                // 防止标签溢出容器
                overflow: 'break', // 超出换行（部分版本支持）
                ellipsis: false // 不显示省略号（强制完整显示）
            },
            // 可选：隐藏轴线
            axisLine: {
                show: false // 如需隐藏轴线，设为 false
            }
        },
        yAxis: [
            {
                type: 'value',
                name: '资质数量',
                
            },
            {
                type: 'value',
                name: '持有率',
                
            },
        ],
        // color: ['#64BEE6', '#10B544'],
        series: [
            {
                name: '资质证书',
                type: 'bar',
                stack: 'stack1', // 第一组堆叠标识
                emphasis: { focus: 'series' },
                data: data1.map((item) => { return item.value1 }),
                barMaxWidth: 40,
                barWidth: 'auto',
                yAxisIndex: 0,
                itemStyle: {
                    color: "#3a96fe",
                    barBorderRadius: 5, 
                    borderWidth: 1,
                    borderColor: '#fff', // 边框宽度（即间隙大小）
                }
            },
          
          
            {
                name: '持有率',
                type: 'line',
                symbol: 'circle', 
                symbolSize: 8, 
                // stack: 'stack2', // 第二组堆叠标识
                emphasis: { focus: 'series' },
                data: data1.map((item) => { return item.value2 }),
                
                yAxisIndex: 1,
                itemStyle: { color: '#42ceaf', borderWidth: 1, borderColor: '#fff', } // 边框宽度（即间隙大小） }
            },
        ]
    }

}
export const echartOption2 = (data1) => {
    const colors = ["#6080E8", "#F0C27F", "#AEE0F9", "#F7A7A4", '#2EAA1D', '#34A4FB']
    return {
        //  title: {
        //         text: '两组堆叠柱状图示例',
        //         left: 'center',
        //         top: 20
        //     },
         tooltip: {
            trigger: "axis",
            axisPointer: {
                type: "shadow",
            },
        },
        legend: {
            // orient: "ver",
            show: true,
            // right: 0,
            left: "center",
            itemGap: 10,
            // width: '50%',
            top: 0,            // icon: "circle",
            textStyle: {
                // 使用回调函数为每个图例项设置颜色
                fontSize: 10,
                // color: function (params: any) {
                //     // 找到当前图例项的索引
                //     const index = data1.findIndex(item => item === params.mgtOrgName);
                //     // 返回对应颜色（使用自定义颜色或ECharts默认颜色）
                //     return colors[index]
                // }
            }

            // itemGap: 10, // 设置图例项之间的间距
        },
        grid: {
            left: "1%",
            right: "3%",
            //   top:'2%',
            bottom: "1%",
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: data1.map((item) => { return item.name }),
            axisTick: {
                show: false // 不显示刻度线
            },
            axisLabel: {
                interval: 0, // 0 表示强制显示所有标签
                // 其他可选样式优化
                rotate: 0, // 标签旋转（避免重叠，可选 30/45/90 度）
                // interval: 0,
                // 调整标签与轴线的距离
                margin: 15,
                // 防止标签溢出容器
                overflow: 'break', // 超出换行（部分版本支持）
                ellipsis: false // 不显示省略号（强制完整显示）
            },
            // 可选：隐藏轴线
            axisLine: {
                show: false // 如需隐藏轴线，设为 false
            }
        },
        yAxis: [
            {
                type: 'value',
                name: '资质数量',
                
            },
            {
                type: 'value',
                name: '持有率',
                
            },
        ],
        // color: ['#64BEE6', '#10B544'],
        series: [
            {
                name: '资质证书',
                type: 'bar',
                stack: 'stack1', // 第一组堆叠标识
                emphasis: { focus: 'series' },
                data: data1.map((item) => { return item.value1 }),
                barMaxWidth: 40,
                barWidth: 'auto',
                yAxisIndex: 0,
                itemStyle: {
                    color: "#2da463",
                    borderWidth: 1,
                    barBorderRadius: 5, 
                    borderColor: '#fff', // 边框宽度（即间隙大小）
                }
            },
          
          
            {
                name: '持有率',
                type: 'line',
                symbol: 'circle', 
                // 2. 设置数据点大小（两种方式二选一）
                // 方式一：固定大小（数值类型，单位：px）
                symbolSize: 8, 
                // stack: 'stack2', // 第二组堆叠标识
                emphasis: { focus: 'series' },
                data: data1.map((item) => { return item.value2 }),
                yAxisIndex: 1,
                itemStyle: { color: '#f8892a', borderWidth: 1, borderColor: '#fff', } // 边框宽度（即间隙大小） }
            },
        ]
    }

}