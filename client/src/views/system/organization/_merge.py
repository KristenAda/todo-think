import pathlib, subprocess, sys

base = pathlib.Path(r'd:/Code/todo-think/client/src/views/system/organization')

# Run each part script to generate txt files
for script in ['_p1.py', '_p2.py', '_p3b.py', '_p4.py']:
    result = subprocess.run([sys.executable, str(base / script)], cwd=str(base), capture_output=True, text=True)
    print(result.stdout.strip(), result.stderr.strip())

# Also need the first part of p3 (the function signature line)
p3_prefix = "  selectedDeptName.value = data.name;\n  loadDeptData();\n};\n"

# Read all parts
part1 = (base / '_part1.txt').read_text(encoding='utf-8')
part2 = (base / '_part2.txt').read_text(encoding='utf-8')
part3_prefix_content = p3_prefix
part3 = (base / '_part3.txt').read_text(encoding='utf-8')
part4 = (base / '_part4.txt').read_text(encoding='utf-8')

# The _p3.py wrote a partial script start; we need to prepend it
p3_start_lines = [
    '<script setup lang="ts">',
    "import { ref, computed, watch, onMounted } from 'vue';",
    "import { ElMessage, ElMessageBox } from 'element-plus';",
    "import type { ElTree } from 'element-plus';",
    "import { useUserStore } from '@/store/modules/user';",
    'import {',
    '  fetchDeptTree,',
    '  fetchDeptManagers,',
    '  fetchDeptMembers,',
    '  fetchAllUsers,',
    '  fetchAddManagers,',
    '  fetchRemoveManager,',
    '  fetchAddMembers,',
    '  fetchRemoveMember',
    "} from '@/api/organization';",
    '',
    'type OrgUser = Api.Organization.OrgUser;',
    'type DeptNode = Api.Organization.DeptTreeNode;',
    '',
    'const userStore = useUserStore();',
    'const currentUserId = computed(() => userStore.info.userId ?? 0);',
    "const isSuperAdmin = computed(() => (userStore.info.roles ?? []).includes('admin'));",
    '',
    'const treeRef = ref<InstanceType<typeof ElTree>>();',
    'const deptTree = ref<DeptNode[]>([]);',
    "const treeFilterText = ref('');",
    "const treeProps = { label: 'name', children: 'children' };",
    'const selectedDeptId = ref<number | null>(null);',
    "const selectedDeptName = ref('');",
    '',
    'const filterNode = (value: string, data: DeptNode) => {',
    '  if (!value) return true;',
    '  return data.name.includes(value);',
    '};',
    'watch(treeFilterText, (val) => { treeRef.value?.filter(val); });',
    'const handleNodeClick = (data: DeptNode) => {',
    '  if (selectedDeptId.value === data.id) return;',
    '  selectedDeptId.value = data.id;',
]
p3_start = '\n'.join(p3_start_lines) + '\n'

full = part1 + part2 + '\n' + p3_start + part3_prefix_content + part3 + '\n' + part4

out = base / 'index.vue'
out.write_text(full, encoding='utf-8')
print(f'Done! Written {len(full)} chars to {out}')

# Cleanup temp files
for f in base.glob('_p*.py'):
    f.unlink()
for f in base.glob('_part*.txt'):
    f.unlink()
print('Cleaned up temp files')
