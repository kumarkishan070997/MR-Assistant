import { describe, it, expect } from 'vitest';
import { detectDeclaration, inferLanguage } from '../src/services/declaration-scanner';

describe('DeclarationScanner', () => {
  describe('inferLanguage', () => {
    it('infers language from file extension correctly', () => {
      expect(inferLanguage('app/Services/OrderService.php')).toBe('php');
      expect(inferLanguage('src/components/Header.tsx')).toBe('typescript');
      expect(inferLanguage('src/utils/math.ts')).toBe('typescript');
      expect(inferLanguage('public/index.js')).toBe('javascript');
      expect(inferLanguage('scripts/build.mjs')).toBe('javascript');
      expect(inferLanguage('backend/main.py')).toBe('python');
      expect(inferLanguage('pkg/server/handler.go')).toBe('go');
      expect(inferLanguage('README.md')).toBe('generic');
      expect(inferLanguage('')).toBe('generic');
    });
  });

  describe('PHP Declaration Detection', () => {
    it('detects public, protected, private, and static methods', () => {
      expect(detectDeclaration('+ public function calculateTotal(Order $order): float', 'Order.php'))
        .toEqual({ symbol: 'calculateTotal', kind: 'function', language: 'php', enclosingClass: 'Order' });

      expect(detectDeclaration('+ protected static function parseXmlPayload($xml)', 'Parser.php'))
        .toEqual({ symbol: 'parseXmlPayload', kind: 'function', language: 'php', enclosingClass: 'Parser' });

      expect(detectDeclaration('- private function authenticateUser()', 'Auth.php'))
        .toEqual({ symbol: 'authenticateUser', kind: 'function', language: 'php', enclosingClass: 'Auth' });

      expect(detectDeclaration('+ function globalHelper($val)', 'helpers.php'))
        .toEqual({ symbol: 'globalHelper', kind: 'function', language: 'php', enclosingClass: undefined });
    });

    it('detects classes, interfaces, and traits', () => {
      expect(detectDeclaration('+ class OrderRepository extends BaseRepository', 'OrderRepository.php'))
        .toEqual({ symbol: 'OrderRepository', kind: 'class', language: 'php', enclosingClass: 'OrderRepository' });

      expect(detectDeclaration('+ final readonly class InvoiceService', 'InvoiceService.php'))
        .toEqual({ symbol: 'InvoiceService', kind: 'class', language: 'php', enclosingClass: 'InvoiceService' });

      expect(detectDeclaration('+ interface PaymentGatewayInterface', 'Contracts.php'))
        .toEqual({ symbol: 'PaymentGatewayInterface', kind: 'class', language: 'php', enclosingClass: 'PaymentGatewayInterface' });

      expect(detectDeclaration('+ trait HasTimestamps', 'Traits.php'))
        .toEqual({ symbol: 'HasTimestamps', kind: 'class', language: 'php', enclosingClass: 'HasTimestamps' });
    });
  });

  describe('TypeScript & JavaScript Declaration Detection', () => {
    it('detects exported and async standard functions', () => {
      expect(detectDeclaration('+ export async function fetchUserById(id: string): Promise<User> {', 'api.ts'))
        .toEqual({ symbol: 'fetchUserById', kind: 'function', language: 'typescript', enclosingClass: undefined });

      expect(detectDeclaration('+ function formatCurrency(amount) {', 'format.js'))
        .toEqual({ symbol: 'formatCurrency', kind: 'function', language: 'javascript', enclosingClass: undefined });

      expect(detectDeclaration('+ export default function MainLayout({ children }) {', 'layout.tsx'))
        .toEqual({ symbol: 'MainLayout', kind: 'function', language: 'typescript', enclosingClass: undefined });
    });

    it('detects arrow function assignments', () => {
      expect(detectDeclaration('+ export const handleFormSubmit = async (e: Event) => {', 'handlers.ts'))
        .toEqual({ symbol: 'handleFormSubmit', kind: 'function', language: 'typescript', enclosingClass: undefined });

      expect(detectDeclaration('+ const renderItem = item => {', 'list.js'))
        .toEqual({ symbol: 'renderItem', kind: 'function', language: 'javascript', enclosingClass: undefined });
    });

    it('detects class declarations', () => {
      expect(detectDeclaration('+ export class NotificationManager extends EventEmitter {', 'notify.ts'))
        .toEqual({ symbol: 'NotificationManager', kind: 'class', language: 'typescript', enclosingClass: 'NotificationManager' });

      expect(detectDeclaration('+ class LocalCache {', 'cache.js'))
        .toEqual({ symbol: 'LocalCache', kind: 'class', language: 'javascript', enclosingClass: 'LocalCache' });
    });
  });

  describe('Python Declaration Detection', () => {
    it('detects def functions', () => {
      expect(detectDeclaration('+ def process_incoming_webhook(payload, headers):', 'webhook.py'))
        .toEqual({ symbol: 'process_incoming_webhook', kind: 'function', language: 'python', enclosingClass: undefined });

      expect(detectDeclaration('+ def __init__(self, config):', 'client.py'))
        .toEqual({ symbol: '__init__', kind: 'function', language: 'python', enclosingClass: undefined });
    });

    it('detects class declarations', () => {
      expect(detectDeclaration('+ class AnalyticsEngine(BaseEngine):', 'analytics.py'))
        .toEqual({ symbol: 'AnalyticsEngine', kind: 'class', language: 'python', enclosingClass: 'AnalyticsEngine' });

      expect(detectDeclaration('+ class ModelTrainer:', 'trainer.py'))
        .toEqual({ symbol: 'ModelTrainer', kind: 'class', language: 'python', enclosingClass: 'ModelTrainer' });
    });
  });

  describe('Go Declaration Detection', () => {
    it('detects standalone functions and receiver methods', () => {
      expect(detectDeclaration('+ func NewServer(config *Config) (*Server, error) {', 'server.go'))
        .toEqual({ symbol: 'NewServer', kind: 'function', language: 'go', enclosingClass: undefined });

      expect(detectDeclaration('+ func (s *Server) HandleRequest(w http.ResponseWriter, r *http.Request) {', 'server.go'))
        .toEqual({ symbol: 'HandleRequest', kind: 'function', language: 'go', enclosingClass: undefined });
    });

    it('detects struct declarations', () => {
      expect(detectDeclaration('+ type TransactionRecord struct {', 'types.go'))
        .toEqual({ symbol: 'TransactionRecord', kind: 'struct', language: 'go', enclosingClass: 'TransactionRecord' });
    });
  });

  describe('Polyglot (Java, C#, Rust, Ruby, Kotlin, Swift, C++) Detection', () => {
    it('detects Java & C# methods and classes', () => {
      expect(detectDeclaration('+ public OrderResponse processPayment(OrderRequest req) {', 'PaymentService.java'))
        .toEqual({ symbol: 'processPayment', kind: 'function', language: 'java', enclosingClass: 'PaymentService' });

      expect(detectDeclaration('+ public async Task<IActionResult> GetUserAsync(int id)', 'UserController.cs'))
        .toEqual({ symbol: 'GetUserAsync', kind: 'function', language: 'csharp', enclosingClass: 'UserController' });

      expect(detectDeclaration('+ public record CustomerAccount(string Id, string Name);', 'CustomerAccount.cs'))
        .toEqual({ symbol: 'CustomerAccount', kind: 'class', language: 'csharp', enclosingClass: 'CustomerAccount' });
    });

    it('detects Rust functions and structs', () => {
      expect(detectDeclaration('+ pub async fn execute_query(conn: &mut Connection) -> Result<()> {', 'db.rs'))
        .toEqual({ symbol: 'execute_query', kind: 'function', language: 'rust', enclosingClass: undefined });

      expect(detectDeclaration('+ pub struct ConnectionPool {', 'pool.rs'))
        .toEqual({ symbol: 'ConnectionPool', kind: 'struct', language: 'rust', enclosingClass: 'ConnectionPool' });
    });

    it('detects Ruby methods and classes', () => {
      expect(detectDeclaration('+ def calculate_tax(amount, state)', 'tax_calculator.rb'))
        .toEqual({ symbol: 'calculate_tax', kind: 'function', language: 'ruby', enclosingClass: undefined });

      expect(detectDeclaration('+ class OrderProcessor', 'order_processor.rb'))
        .toEqual({ symbol: 'OrderProcessor', kind: 'class', language: 'ruby', enclosingClass: 'OrderProcessor' });
    });

    it('detects Kotlin and Swift functions', () => {
      expect(detectDeclaration('+ suspend fun fetchUserProfile(userId: String): User {', 'UserService.kt'))
        .toEqual({ symbol: 'fetchUserProfile', kind: 'function', language: 'kotlin', enclosingClass: 'UserService' });

      expect(detectDeclaration('+ func authenticateWithBiometrics() async throws -> Bool {', 'AuthManager.swift'))
        .toEqual({ symbol: 'authenticateWithBiometrics', kind: 'function', language: 'swift', enclosingClass: 'AuthManager' });
    });

    it('detects C++ methods and classes', () => {
      expect(detectDeclaration('+ class NetworkSocket : public BaseSocket {', 'socket.hpp'))
        .toEqual({ symbol: 'NetworkSocket', kind: 'class', language: 'cpp', enclosingClass: 'NetworkSocket' });

      expect(detectDeclaration('+ void SocketManager::initializeConnection() {', 'socket.cpp'))
        .toEqual({ symbol: 'initializeConnection', kind: 'function', language: 'cpp', enclosingClass: 'SocketManager' });
    });
  });

  describe('Comment & False Positive Filters', () => {
    it('ignores lines that are commented out', () => {
      expect(detectDeclaration('+ // function oldFunction() {', 'app.ts')).toBeNull();
      expect(detectDeclaration('+ /* class DeprecatedClass */', 'app.ts')).toBeNull();
      expect(detectDeclaration('+ # def old_python_helper():', 'script.py')).toBeNull();
      expect(detectDeclaration('+ * class InsideDocblock', 'doc.php')).toBeNull();
    });

    it('ignores non-declaration lines', () => {
      expect(detectDeclaration('+ const x = 42;', 'app.ts')).toBeNull();
      expect(detectDeclaration('+ return calculateTotal($order);', 'calc.php')).toBeNull();
      expect(detectDeclaration('+ import { useState } from "react";', 'comp.tsx')).toBeNull();
      expect(detectDeclaration('', 'file.ts')).toBeNull();
      expect(detectDeclaration('   ', 'file.ts')).toBeNull();
    });
  });
});
