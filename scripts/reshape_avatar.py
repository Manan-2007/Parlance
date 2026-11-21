import struct
import json
import shutil
import os
import numpy as np

def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)

def recompute_normals(positions, indices, original_normals, blend_weights):
    """
    Recompute area-weighted vertex normals from triangle mesh,
    and blend with original normals based on blend_weights.
    """
    normals = np.zeros_like(positions)
    # indices: (num_triangles, 3)
    tris = positions[indices] # (num_triangles, 3, 3)
    v0 = tris[:, 0]
    v1 = tris[:, 1]
    v2 = tris[:, 2]
    e1 = v1 - v0
    e2 = v2 - v0
    fn = np.cross(e1, e2) # cross product: face normal * 2 * area
    
    # Accumulate face normals to vertices
    np.add.at(normals, indices[:, 0], fn)
    np.add.at(normals, indices[:, 1], fn)
    np.add.at(normals, indices[:, 2], fn)
    
    # Normalize
    norms = np.linalg.norm(normals, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    normals = normals / norms
    
    # Blend with original normals
    # Where blend_weights == 0, keep 100% original normals
    bw = blend_weights[:, np.newaxis]
    blended = original_normals * (1.0 - bw) + normals * bw
    blended_norms = np.linalg.norm(blended, axis=1, keepdims=True)
    blended_norms[blended_norms == 0] = 1.0
    return (blended / blended_norms).astype(np.float32)

def deform_mesh(pts, mesh_name, gltf, prim, bin_data):
    """
    Deforms mesh points to achieve athletic V-taper.
    Returns (new_pts, blend_weights)
    """
    new_pts = pts.copy()
    
    # Check for joints and weights if available
    is_hand = np.zeros(len(pts), dtype=bool)
    is_head = np.zeros(len(pts), dtype=bool)
    
    if 'JOINTS_0' in prim['attributes'] and 'WEIGHTS_0' in prim['attributes']:
        j_acc = gltf['accessors'][prim['attributes']['JOINTS_0']]
        j_bv = gltf['bufferViews'][j_acc['bufferView']]
        j_off = j_bv.get('byteOffset', 0) + j_acc.get('byteOffset', 0)
        joints = np.frombuffer(bin_data, dtype=np.uint16, count=len(pts)*4, offset=j_off).reshape((-1, 4))
        
        w_acc = gltf['accessors'][prim['attributes']['WEIGHTS_0']]
        w_bv = gltf['bufferViews'][w_acc['bufferView']]
        w_off = w_bv.get('byteOffset', 0) + w_acc.get('byteOffset', 0)
        weights = np.frombuffer(bin_data, dtype=np.float32, count=len(pts)*4, offset=w_off).reshape((-1, 4))
        
        hand_joints = list(range(17, 38)) + list(range(46, 67))
        head_joints = [39, 40]
        
        for col in range(4):
            is_hand |= np.isin(joints[:, col], hand_joints) & (weights[:, col] > 0.05)
            is_head |= np.isin(joints[:, col], head_joints) & (weights[:, col] > 0.05)

    spine_z = -0.014 + (pts[:, 1] - 2.0) * (-0.088 - (-0.014)) / (2.8 - 2.0)
    spine_z = np.clip(spine_z, -0.09, -0.01)
    
    dz = pts[:, 2] - spine_z
    x = pts[:, 0]
    y = pts[:, 1]
    
    # 1. Waist narrow factor (Y in [2.15, 2.65], peak at 2.38)
    # Narrow waist by 17% in X, 18% in Z
    waist_t = np.exp(-((y - 2.38) / 0.22) ** 2)
    
    # 2. Hips narrow factor (Y in [1.70, 2.15], peak at 1.95)
    # Narrow hips by 10% in X
    hips_t = np.exp(-((y - 1.95) / 0.18) ** 2)
    
    # 3. Shoulder widen factor (Y in [2.90, 3.15], peak at 3.02)
    # Shoulders ~12-14% wider in X
    shoulder_y_t = np.exp(-((y - 3.02) / 0.16) ** 2)
    # Deltoid profile across X:
    shoulder_x_t = smoothstep(0.06, 0.22, np.abs(x)) * (1.0 - smoothstep(0.50, 0.85, np.abs(x)))
    shoulder_t = shoulder_y_t * shoulder_x_t
    
    # 4. Chest / lats fullness (Y in [2.65, 2.92], peak at 2.78)
    chest_y_t = np.exp(-((y - 2.78) / 0.14) ** 2)
    chest_t = chest_y_t * (1.0 - smoothstep(0.25, 0.52, np.abs(x)))
    
    # 5. Arm toning (|X| in [0.48, 0.95], Y in [2.85, 3.12])
    arm_x_t = smoothstep(0.48, 0.58, np.abs(x)) * (1.0 - smoothstep(0.85, 1.05, np.abs(x)))
    arm_y_t = np.exp(-((y - 3.00) / 0.16) ** 2)
    arm_t = arm_x_t * arm_y_t
    
    # Combined scales
    scale_x = (1.0 - 0.17 * waist_t - 0.10 * hips_t + 0.13 * shoulder_t + 0.05 * chest_t) * (1.0 - 0.05 * arm_t)
    scale_z = (1.0 - 0.18 * waist_t - 0.08 * hips_t + 0.05 * chest_t) * (1.0 - 0.05 * arm_t)
    
    # Flat stomach: pull forward volume back slightly
    flat_stomach = np.maximum(0.0, dz) * 0.07 * waist_t
    
    new_x = x * scale_x
    new_z = spine_z + (dz * scale_z) - flat_stomach
    
    # Blend masks to protect head, hands, and lower legs:
    hand_blend = 1.0 - smoothstep(1.10, 1.35, np.abs(x))
    head_blend = 1.0 - smoothstep(3.12, 3.22, y)
    leg_blend = smoothstep(1.45, 1.65, y)
    
    blend = hand_blend * head_blend * leg_blend
    blend[is_hand] = 0.0
    blend[is_head] = 0.0
    
    new_pts[:, 0] = pts[:, 0] * (1.0 - blend) + new_x * blend
    new_pts[:, 2] = pts[:, 2] * (1.0 - blend) + new_z * blend
    
    return new_pts, blend

def process_glb(input_path, output_path):
    print(f"Reading {input_path}...")
    with open(input_path, 'rb') as f:
        magic, version, length = struct.unpack('<4sII', f.read(12))
        chunk_len, chunk_type = struct.unpack('<II', f.read(8))
        json_bytes = f.read(chunk_len)
        gltf = json.loads(json_bytes.decode('utf-8'))
        chunk2_len, chunk2_type = struct.unpack('<II', f.read(8))
        bin_data = bytearray(f.read(chunk2_len))

    accessors = gltf['accessors']
    bufferViews = gltf['bufferViews']

    # Target meshes: 0 (Body), 1 (Bottoms), 6 (Tops)
    target_mesh_indices = [0, 1, 6]
    
    for m_idx in target_mesh_indices:
        mesh = gltf['meshes'][m_idx]
        mesh_name = mesh.get('name', f'Mesh_{m_idx}')
        prim = mesh['primitives'][0]
        
        pos_acc_idx = prim['attributes']['POSITION']
        norm_acc_idx = prim['attributes']['NORMAL']
        ind_acc_idx = prim['indices']
        
        pos_acc = accessors[pos_acc_idx]
        norm_acc = accessors[norm_acc_idx]
        ind_acc = accessors[ind_acc_idx]
        
        count = pos_acc['count']
        
        # Read positions
        pos_bv = bufferViews[pos_acc['bufferView']]
        pos_off = pos_bv.get('byteOffset', 0) + pos_acc.get('byteOffset', 0)
        positions = np.frombuffer(bin_data, dtype=np.float32, count=count*3, offset=pos_off).reshape((count, 3)).copy()
        
        # Read normals
        norm_bv = bufferViews[norm_acc['bufferView']]
        norm_off = norm_bv.get('byteOffset', 0) + norm_acc.get('byteOffset', 0)
        normals = np.frombuffer(bin_data, dtype=np.float32, count=count*3, offset=norm_off).reshape((count, 3)).copy()
        
        # Read indices
        ind_bv = bufferViews[ind_acc['bufferView']]
        ind_off = ind_bv.get('byteOffset', 0) + ind_acc.get('byteOffset', 0)
        ind_type = np.uint16 if ind_acc['componentType'] == 5123 else np.uint32
        indices = np.frombuffer(bin_data, dtype=ind_type, count=ind_acc['count'], offset=ind_off).reshape((-1, 3))
        
        # Deform
        new_positions, blend_weights = deform_mesh(positions, mesh_name, gltf, prim, bin_data)
        
        # Recompute normals
        new_normals = recompute_normals(new_positions, indices, normals, blend_weights)
        
        # Write back to binary chunk
        pos_bytes = new_positions.astype(np.float32).tobytes()
        norm_bytes = new_normals.astype(np.float32).tobytes()
        
        bin_data[pos_off:pos_off + len(pos_bytes)] = pos_bytes
        bin_data[norm_off:norm_off + len(norm_bytes)] = norm_bytes
        
        # Update min and max in accessor
        pos_acc['min'] = new_positions.min(axis=0).tolist()
        pos_acc['max'] = new_positions.max(axis=0).tolist()
        
        print(f"Mesh {mesh_name} ({count} verts):")
        print(f"  Old X range: [{positions[:, 0].min():.4f}, {positions[:, 0].max():.4f}]")
        print(f"  New X range: [{new_positions[:, 0].min():.4f}, {new_positions[:, 0].max():.4f}]")
        print(f"  Old Z range: [{positions[:, 2].min():.4f}, {positions[:, 2].max():.4f}]")
        print(f"  New Z range: [{new_positions[:, 2].min():.4f}, {new_positions[:, 2].max():.4f}]")
        print(f"  Modified count (blend > 0.01): {(blend_weights > 0.01).sum()}/{count}")

    # Re-encode GLB
    # Make sure JSON is padded to 4-byte alignment with spaces
    new_json_bytes = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
    pad = (4 - (len(new_json_bytes) % 4)) % 4
    new_json_bytes += b' ' * pad
    
    total_len = 12 + 8 + len(new_json_bytes) + 8 + len(bin_data)
    
    header = struct.pack('<4sII', magic, version, total_len)
    chunk0_hdr = struct.pack('<II', len(new_json_bytes), chunk_type)
    chunk1_hdr = struct.pack('<II', len(bin_data), chunk2_type)
    
    with open(output_path, 'wb') as f:
        f.write(header)
        f.write(chunk0_hdr)
        f.write(new_json_bytes)
        f.write(chunk1_hdr)
        f.write(bin_data)
        
    print(f"Saved reshaped GLB to {output_path} ({total_len} bytes)")

# Backup original remy.glb if not already backed up
backup_path = 'parlance/public/assets/remy.original.glb'
if not os.path.exists(backup_path):
    shutil.copy('parlance/public/assets/remy.glb', backup_path)
    print(f"Created backup: {backup_path}")

process_glb('parlance/public/assets/remy.original.glb', 'parlance/public/assets/remy.glb')
