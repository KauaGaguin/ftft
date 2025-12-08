package com.mariascent.dao;

import com.mariascent.model.produto;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class produtoDAO {
    private String jdbcURL = "jdbc:mysql://localhost:3306/maria_scent";
    private String jdbcUsername = "root";
    private String jdbcPassword = "root";

    public List<produto> listarProdutos() {
        List<produto> produtos = new ArrayList<>();

        String sql = "SELECT * FROM produtos";

        try (Connection conn = DriverManager.getConnection(jdbcURL, jdbcUsername, jdbcPassword);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                int id = rs.getInt("id");
                String nome = rs.getString("nome");
                double preco = rs.getDouble("preco");

                produto produto = new produto(id, nome, preco);
                produtos.add(produto);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return produtos;
    }
}
