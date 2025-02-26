import { Router } from 'itty-router';
import bcrypt from 'bcryptjs';
import jwt from '@tsndr/cloudflare-worker-jwt';
import { ExecutionContext } from '@cloudflare/workers-types';
import { D1Database } from '@cloudflare/workers-types/experimental';

export interface Env {
  DB: D1Database;
}

interface JWTPayload {
  email: string;
  exp: number;
}

interface Project {
  id: number;
  name: string;
  walls: string;
  doors: string;
  windows: string;
  created_at: string;
  user_id: number;
}

const router = Router();
const JWT_SECRET = 'seu_segredo_jwt';

const TOKEN_EXPIRATION = 60 * 60 * 24;

const corsHeaders = {
  // 'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
};

router.all('*', (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
});

router.post('/register', async (req, env) => {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };

  try {
    const { name, email, password } = await req.json();

    const existingUser = await env.DB
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first();

    if (existingUser) {
      return new Response(
        JSON.stringify({ message: 'Usuário já existe' }), 
        { status: 400, headers }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await env.DB
      .prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
      .bind(name, email, hashedPassword)
      .run();

    const token = await jwt.sign({ 
      email,
      exp: Math.floor(Date.now() / 1000) + 3600
    }, JWT_SECRET);

    return new Response(
      JSON.stringify({ token }), 
      { status: 201, headers }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ message: 'Erro interno do servidor' }), 
      { status: 500, headers }
    );
  }
});

router.post('/login', async (req, env) => {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };

  try {
    const { email, password } = await req.json();

    const user = await env.DB
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first();

    if (!user) {
      return new Response(
        JSON.stringify({ message: 'Usuário não encontrado' }), 
        { status: 400, headers }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return new Response(
        JSON.stringify({ message: 'Senha incorreta' }), 
        { status: 400, headers }
      );
    }

    const token = await jwt.sign({ 
      email,
      exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION
    }, JWT_SECRET);

    return new Response(
      JSON.stringify({ token }), 
      { status: 200, headers }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ message: 'Erro interno do servidor' }), 
      { status: 500, headers }
    );
  }
});

router.post('/projects', async (request: Request, env: Env) => {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };

  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Token não fornecido' }), 
        { status: 401, headers }
      );
    }

    const isValid = await jwt.verify(token, JWT_SECRET);
    if (!isValid) {
      return new Response(
        JSON.stringify({ message: 'Token inválido' }), 
        { status: 401, headers }
      );
    }

    const decoded = await jwt.decode(token);
    const payload = decoded.payload as JWTPayload;
    const { email } = payload;

    const user = await env.DB
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first();

    if (!user) {
      return new Response(
        JSON.stringify({ message: 'Usuário não encontrado' }), 
        { status: 404, headers }
      );
    }

    const { name } = await request.json();

    const result = await env.DB
      .prepare('INSERT INTO projects (user_id, name) VALUES (?, ?)')
      .bind(user.id, name)
      .run();

    return new Response(
      JSON.stringify({ 
        id: result.meta.last_row_id,
        name,
        message: 'Projeto criado com sucesso' 
      }), 
      { status: 201, headers }
    );
  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ 
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : String(error)
      }), 
      { 
        status: 500, 
        headers 
      }
    );
  }
});

router.get('/projects', async (req, env) => {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };

  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Token não fornecido' }), 
        { status: 401, headers }
      );
    }

    const isValid = await jwt.verify(token, JWT_SECRET);
    if (!isValid) {
      return new Response(
        JSON.stringify({ message: 'Token inválido' }), 
        { status: 401, headers }
      );
    }

    const decoded = await jwt.decode(token);
    const payload = decoded.payload as JWTPayload;
    const { email } = payload;

    const projects = await env.DB
      .prepare(`
        SELECT p.* 
        FROM projects p
        JOIN users u ON p.user_id = u.id
        WHERE u.email = ?
        ORDER BY p.created_at DESC
      `)
      .bind(email)
      .all();

    return new Response(
      JSON.stringify(projects.results), 
      { status: 200, headers }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ message: 'Erro interno do servidor' }), 
      { status: 500, headers }
    );
  }
});

router.get('/projects/:id', async (request: Request, env: Env) => {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Token não fornecido' }), 
        { status: 401, headers }
      );
    }

    const isValid = await jwt.verify(token, JWT_SECRET);
    if (!isValid) {
      return new Response(
        JSON.stringify({ message: 'Token inválido' }), 
        { status: 401, headers }
      );
    }

    const decoded = await jwt.decode(token);
    const payload = decoded.payload as JWTPayload;
    const { email } = payload;

    const url = new URL(request.url);
    const projectId = url.pathname.split('/').pop();

    if (!projectId) {
      return new Response(
        JSON.stringify({ message: 'ID do projeto não fornecido' }), 
        { status: 400, headers }
      );
    }

    const project = await env.DB
      .prepare(`
        SELECT p.* 
        FROM projects p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ? AND u.email = ?
      `)
      .bind(projectId, email)
      .first() as Project | null;

    if (!project) {
      return new Response(
        JSON.stringify({ message: 'Projeto não encontrado' }), 
        { status: 404, headers }
      );
    }

    return new Response(
      JSON.stringify({
        id: project.id,
        name: project.name,
        walls: JSON.parse(project.walls || '[]'),
        doors: JSON.parse(project.doors || '[]'),
        windows: JSON.parse(project.windows || '[]'),
        created_at: project.created_at,
      }), 
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ 
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : String(error)
      }), 
      { status: 500, headers }
    );
  }
});

router.put('/projects/:id', async (request: Request, env: Env) => {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };

  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Token não fornecido' }), 
        { status: 401, headers }
      );
    }

    const isValid = await jwt.verify(token, JWT_SECRET);
    if (!isValid) {
      return new Response(
        JSON.stringify({ message: 'Token inválido' }), 
        { status: 401, headers }
      );
    }

    const decoded = await jwt.decode(token);
    const payload = decoded.payload as JWTPayload;
    const { email } = payload;

    const url = new URL(request.url);
    const projectId = url.pathname.split('/').pop();

    if (!projectId) {
      return new Response(
        JSON.stringify({ message: 'ID do projeto não fornecido' }), 
        { status: 400, headers }
      );
    }

    const project = await env.DB
      .prepare(`
        SELECT p.* 
        FROM projects p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ? AND u.email = ?
      `)
      .bind(projectId, email)
      .first();

    if (!project) {
      return new Response(
        JSON.stringify({ message: 'Projeto não encontrado' }), 
        { status: 404, headers }
      );
    }

    const { name, walls, doors, windows } = await request.json();

    await env.DB
      .prepare(`
        UPDATE projects 
        SET name = ?, 
            walls = ?, 
            doors = ?, 
            windows = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(
        name, 
        JSON.stringify(walls), 
        JSON.stringify(doors), 
        JSON.stringify(windows), 
        projectId
      )
      .run();

    return new Response(
      JSON.stringify({ 
        message: 'Projeto atualizado com sucesso',
        id: projectId,
        name,
        walls,
        doors,
        windows
      }), 
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ 
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : String(error)
      }), 
      { status: 500, headers }
    );
  }
});

const authenticate = async (req: Request) => {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return new Response(
      JSON.stringify({ message: 'Acesso negado. Token não fornecido.' }), 
      { status: 401 }
    );
  }

  try {
    const decoded = await jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    return new Response(
      JSON.stringify({ message: 'Token inválido' }), 
      { status: 401 }
    );
  }
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    try {
      const response = await router.handle(request, env);
      
      if (!response) {
        return new Response('Not Found', { 
          status: 404,
          headers: corsHeaders
        });
      }

      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders
      });
    } catch (error) {
      console.error('Erro:', error);
      return new Response(
        JSON.stringify({ 
          message: 'Erro interno do servidor',
          error: error instanceof Error ? error.message : String(error)
        }), 
        { 
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }
};