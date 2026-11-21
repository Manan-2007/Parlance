import struct
import json
import numpy as np

def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)

def apply_face_fixes(glb_path):
    print(f"Loading {glb_path}...")
    with open(glb_path, 'rb') as f:
        magic, version, length = struct.unpack('<4sII', f.read(12))
        chunk_len, chunk_type = struct.unpack('<II', f.read(8))
        json_bytes = f.read(chunk_len)
        gltf = json.loads(json_bytes.decode('utf-8'))
        chunk2_len, chunk2_type = struct.unpack('<II', f.read(8))
        bin_data = bytearray(f.read(chunk2_len))

    accessors = gltf['accessors']
    bufferViews = gltf['bufferViews']

    # 1. FIX UNDER-EYE BLACK PATCHES:
    # Mesh 2 (Eyelashes): degenerate the lower eyelash triangles
    eyelash_prim = gltf['meshes'][2]['primitives'][0]
    ind_acc = accessors[eyelash_prim['indices']]
    ind_bv = bufferViews[ind_acc['bufferView']]
    ind_off = ind_bv.get('byteOffset', 0) + ind_acc.get('byteOffset', 0)
    ind_type = np.uint16 if ind_acc['componentType'] == 5123 else np.uint32
    indices = np.frombuffer(bin_data, dtype=ind_type, count=ind_acc['count'], offset=ind_off).reshape((-1, 3)).copy()

    pos_acc = accessors[eyelash_prim['attributes']['POSITION']]
    pos_bv = bufferViews[pos_acc['bufferView']]
    pos_off = pos_bv.get('byteOffset', 0) + pos_acc.get('byteOffset', 0)
    eyelash_pos = np.frombuffer(bin_data, dtype=np.float32, count=pos_acc['count']*3, offset=pos_off).reshape((-1, 3))

    tri_y = eyelash_pos[indices][:, :, 1].mean(axis=1)
    lower_tris = tri_y < 3.495
    print(f"Eyelashes: removing {lower_tris.sum()} lower eyelash triangles out of {len(indices)}")
    
    # Set lower triangles to [0, 0, 0] (degenerate triangles, discarded by WebGL)
    indices[lower_tris] = 0
    bin_data[ind_off:ind_off + len(indices.tobytes())] = indices.tobytes()

    # 2. FIX LIP SIZE:
    # Mesh 0 (Body): increase lip volume by ~20%
    body_prim = gltf['meshes'][0]['primitives'][0]
    b_pos_acc = accessors[body_prim['attributes']['POSITION']]
    b_pos_bv = bufferViews[b_pos_acc['bufferView']]
    b_pos_off = b_pos_bv.get('byteOffset', 0) + b_pos_acc.get('byteOffset', 0)
    b_pos = np.frombuffer(bin_data, dtype=np.float32, count=b_pos_acc['count']*3, offset=b_pos_off).reshape((-1, 3)).copy()

    b_norm_acc = accessors[body_prim['attributes']['NORMAL']]
    b_norm_bv = bufferViews[b_norm_acc['bufferView']]
    b_norm_off = b_norm_bv.get('byteOffset', 0) + b_norm_acc.get('byteOffset', 0)
    b_norm = np.frombuffer(bin_data, dtype=np.float32, count=b_norm_acc['count']*3, offset=b_norm_off).reshape((-1, 3)).copy()

    b_uv_acc = accessors[body_prim['attributes']['TEXCOORD_0']]
    b_uv_bv = bufferViews[b_uv_acc['bufferView']]
    b_uv_off = b_uv_bv.get('byteOffset', 0) + b_uv_acc.get('byteOffset', 0)
    b_uv = np.frombuffer(bin_data, dtype=np.float32, count=b_uv_acc['count']*2, offset=b_uv_off).reshape((-1, 2))

    b_ind_acc = accessors[body_prim['indices']]
    b_ind_bv = bufferViews[b_ind_acc['bufferView']]
    b_ind_off = b_ind_bv.get('byteOffset', 0) + b_ind_acc.get('byteOffset', 0)
    b_ind_type = np.uint16 if b_ind_acc['componentType'] == 5123 else np.uint32
    b_ind = np.frombuffer(bin_data, dtype=b_ind_type, count=b_ind_acc['count'], offset=b_ind_off).reshape((-1, 3))

    # Lip filter: UV in [0.23, 0.28] x [0.195, 0.255], Z > 0.21 (outer face, not teeth/mouth cavity)
    lip_mask = (b_uv[:, 0] >= 0.23) & (b_uv[:, 0] <= 0.28) & (b_uv[:, 1] >= 0.195) & (b_uv[:, 1] <= 0.255) & (b_pos[:, 2] > 0.21)
    print(f"Body: found {lip_mask.sum()} outer lip vertices to augment")

    xc = 0.017
    yc = 3.355 # oral fissure / mouth line
    dx = b_pos[:, 0] - xc
    dy = b_pos[:, 1] - yc
    
    # Horizontal taper: full in center, smooth falloff to corners at |dx| ~ 0.035
    taper_x = smoothstep(0.040, 0.015, np.abs(dx))
    
    # Vertical taper and expansion
    upper_mask = lip_mask & (dy >= 0)
    lower_mask = lip_mask & (dy < 0)
    
    new_b_pos = b_pos.copy()
    
    # Upper lip: expand forward (+Z) and slightly upward (+Y)
    taper_y_upper = smoothstep(0.038, 0.005, dy)
    lip_factor_upper = taper_x * taper_y_upper * upper_mask
    new_b_pos[:, 2] += 0.008 * lip_factor_upper # +Z forward volume
    new_b_pos[:, 1] += 0.0035 * lip_factor_upper # +Y fullness
    
    # Lower lip: expand forward (+Z) and slightly downward (-Y)
    taper_y_lower = smoothstep(0.045, 0.005, -dy)
    lip_factor_lower = taper_x * taper_y_lower * lower_mask
    new_b_pos[:, 2] += 0.009 * lip_factor_lower # +Z forward volume
    new_b_pos[:, 1] -= 0.0045 * lip_factor_lower # -Y fullness
    
    total_lip_factor = lip_factor_upper + lip_factor_lower
    
    # Recompute vertex normals around mouth
    tris = new_b_pos[b_ind]
    fn = np.cross(tris[:, 1] - tris[:, 0], tris[:, 2] - tris[:, 0])
    normals = np.zeros_like(new_b_pos)
    np.add.at(normals, b_ind[:, 0], fn)
    np.add.at(normals, b_ind[:, 1], fn)
    np.add.at(normals, b_ind[:, 2], fn)
    norms = np.linalg.norm(normals, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    normals = normals / norms
    
    # Blend normals
    bf = total_lip_factor[:, np.newaxis]
    blended_norm = b_norm * (1.0 - bf) + normals * bf
    bn_len = np.linalg.norm(blended_norm, axis=1, keepdims=True)
    bn_len[bn_len == 0] = 1.0
    blended_norm = (blended_norm / bn_len).astype(np.float32)

    # Write positions and normals back
    bin_data[b_pos_off:b_pos_off + len(new_b_pos.tobytes())] = new_b_pos.astype(np.float32).tobytes()
    bin_data[b_norm_off:b_norm_off + len(blended_norm.tobytes())] = blended_norm.tobytes()

    b_pos_acc['min'] = new_b_pos.min(axis=0).tolist()
    b_pos_acc['max'] = new_b_pos.max(axis=0).tolist()

    # Re-encode GLB
    new_json_bytes = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
    pad = (4 - (len(new_json_bytes) % 4)) % 4
    new_json_bytes += b' ' * pad
    
    total_len = 12 + 8 + len(new_json_bytes) + 8 + len(bin_data)
    header = struct.pack('<4sII', magic, version, total_len)
    chunk0_hdr = struct.pack('<II', len(new_json_bytes), chunk_type)
    chunk1_hdr = struct.pack('<II', len(bin_data), chunk2_type)

    with open(glb_path, 'wb') as f:
        f.write(header)
        f.write(chunk0_hdr)
        f.write(new_json_bytes)
        f.write(chunk1_hdr)
        f.write(bin_data)
        
    print(f"Successfully applied face fixes to {glb_path} ({total_len} bytes)")

apply_face_fixes('parlance/public/assets/remy.glb')
