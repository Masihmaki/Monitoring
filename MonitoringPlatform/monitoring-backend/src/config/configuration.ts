export type AppConfiguration = {
  port: number;
  corsOrigins: string[];
  db: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    synchronize: boolean;
  };
  alerts: {
    cpuThreshold: number;
    ramThreshold: number;
    diskThreshold: number;
    cooldownMinutes: number;
  };
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env and set it.`,
    );
  }
  return value;
}

function csv(name: string, fallback: string): string[] {
  return (process.env[name] ?? fallback)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function configuration(): AppConfiguration {
  return {
    port: parseInt(process.env.PORT ?? '3000', 10),
    corsOrigins: csv('CORS_ORIGIN', 'http://localhost:5173'),
    db: {
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: required('POSTGRES_USER'),
      password: required('POSTGRES_PASSWORD'),
      database: required('POSTGRES_DB'),
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
    },
    alerts: {
      cpuThreshold: parseFloat(process.env.ALERT_CPU_THRESHOLD ?? '80'),
      ramThreshold: parseFloat(process.env.ALERT_RAM_THRESHOLD ?? '85'),
      diskThreshold: parseFloat(process.env.ALERT_DISK_THRESHOLD ?? '90'),
      cooldownMinutes: parseInt(process.env.ALERT_COOLDOWN_MINUTES ?? '5', 10),
    },
  };
}
