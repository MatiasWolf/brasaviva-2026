export interface Producto {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    categoria_id: number;
    foto_url: string;   
    foto2_url: string;  
    foto3_url: string;  
    tiempo_preparacion: number;
    disponible: boolean;
    created_at: string;
}

export interface ItemCarrito {
    producto: Producto;
    cantidad: number;
}