path = r'd:/Code/todo-think/client/src/views/task/detail/TaskDetailDrawer.vue'

with open(path, 'rb') as f:
    raw = f.read()

old = b'      const res = await fetchTaskInfo(props.taskId);\n      if (res.data?.code === 200) {\n        task.value = res.data.data;\n        // \xe5\x88\x9d\xe5\xa7\x8b\xe5\x8c\x96 selfTestMap\n        (task.value?.testCases ?? []).forEach((tc) => {\n          selfTestMap[tc.id] = tc.selfTestStatus;\n          selfTestRemarkMap[tc.id] = tc.selfTestRemark ?? \'\';\n        });\n      }'

new = b'      const data = await fetchTaskInfo(props.taskId);\n      if (data) {\n        task.value = data;\n        (task.value?.testCases ?? []).forEach((tc) => {\n          selfTestMap[tc.id] = tc.selfTestStatus;\n          selfTestRemarkMap[tc.id] = tc.selfTestRemark ?? \'\';\n        });\n      }'

if old in raw:
    result = raw.replace(old, new, 1)
    with open(path, 'wb') as f:
        f.write(result)
    print('Patched OK')
else:
    # debug: find nearby bytes
    idx = raw.find(b'fetchTaskInfo')
    print(f'fetchTaskInfo at: {idx}')
    print(repr(raw[idx:idx+300]))
