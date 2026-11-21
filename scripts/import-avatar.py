"""Run with Blender --background --python scripts/import-avatar.py -- source.fbx output.glb.

Packages a supplied Mixamo rig at 1.8m with its textures and no baked animation.
Procedural sign playback supplies animation in the application.
"""
import bpy
import hashlib
import json
from mathutils import Vector
from pathlib import Path
import sys

source, destination = map(Path, sys.argv[sys.argv.index('--') + 1:])
destination.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=str(source), use_anim=False)
rigs = [obj for obj in bpy.context.scene.objects if obj.type == 'ARMATURE']
if len(rigs) != 1:
    raise RuntimeError(f'Expected one signing armature, found {len(rigs)}')
rig = rigs[0]
meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and obj.find_armature() == rig]
if not meshes:
    raise RuntimeError('No skinned meshes found')
points = [obj.matrix_world @ Vector(point) for obj in meshes for point in obj.bound_box]
low, high = min(point.z for point in points), max(point.z for point in points)
if high-low <= 0:
    raise RuntimeError('Invalid avatar height')
roots = [obj for obj in bpy.context.scene.objects if obj.parent is None]
root = bpy.data.objects.new('SigningAvatarScale', None)
bpy.context.collection.objects.link(root)
for obj in roots:
    world = obj.matrix_world.copy()
    obj.parent = root
    obj.matrix_world = world
scale = 1.8/(high-low)
root.scale = (scale, scale, scale)
root.location.z = -low*scale
report = {'sourceFilename':source.name, 'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
    'armature':rig.name, 'boneCount':len(rig.data.bones), 'bones':[bone.name for bone in rig.data.bones],
    'meshes':[obj.name for obj in meshes], 'heightMeters':1.8,
    'materials':[mat.name for mat in bpy.data.materials if mat.users],
    'images':[(im.name,list(im.size),bool(im.packed_file)) for im in bpy.data.images if im.users],
    'faceKeys':[key.name for obj in meshes if obj.data.shape_keys for key in obj.data.shape_keys.key_blocks]}
print('AVATAR_IMPORT '+json.dumps(report), flush=True)
bpy.ops.export_scene.gltf(filepath=str(destination),export_format='GLB',export_animations=False,
    export_yup=True,export_skins=True,export_image_format='AUTO')
destination.with_suffix('.import.json').write_text(json.dumps(report,indent=2)+'\n')
